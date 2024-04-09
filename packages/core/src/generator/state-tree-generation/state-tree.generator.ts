import {
  PropertyDefinition,
  PropertyType,
  isComplex,
  isArray,
} from '../../resources/properties/properties';
import {
  ErasedDesiredState,
  createDesiredState,
} from '../../resources/desired-state';
import { PropertyValues, PropertyMap } from '../../resources/resource';
import { getRandomInt, maybeUndefined } from '../../utilities';
import { getValueForPrimativeType } from './primatives.generator';
import {
  getRuntimeResourceValue,
  isRuntimeValue,
} from '../../resources/runtime-values';
import { GenerationResult } from '../../resources/properties';
import {
  getParentConstraintsUtilsAndResults,
  isLinkType,
  ParentCreationMode,
} from '../../resources/properties/links';
import {
  NewStateAndConstraints,
  pathMatches,
  StateAndConstraints,
  StateConstraint,
} from '../../resources/state-constraints';
import {
  LinkConstraint,
  getGenerationLimitValue,
} from '../../resources/properties/constraints';
import {
  PropertyPathSegment,
  arrayIndexAccess,
  propAccess,
} from '../../resources/utilities/proxy-path';

function fillInType(
  current: NewStateAndConstraints,
  currentPath: PropertyPathSegment[],
  type: PropertyType,
  inputs: PropertyValues<PropertyMap>
): [any, StateAndConstraints[]] {
  const matchingConstraints = current.constraints.filter(({ path }) =>
    pathMatches(currentPath, path)
  );
  if (matchingConstraints.length > 0) {
    const valueConstraint = matchingConstraints.find((c) => 'value' in c);
    if (valueConstraint) {
      let value = valueConstraint.value;
      const constraintsAndState = [];
      if (value instanceof Function) {
        const [baseGeneratedValue, baseConstraintsAndState] = fillInType(
          {
            ...current,
            constraints: current.constraints.filter(
              (c) => !matchingConstraints.includes(c)
            ),
          },
          currentPath,
          type,
          inputs
        );
        value = value(baseGeneratedValue);
        constraintsAndState.push(...baseConstraintsAndState);
      }
      // TODO: Better access and modeling for links

      if (isRuntimeValue(value) && value.depdendentStateNames.length > 0) {
        const ancestorConstraints = matchingConstraints
          .filter((c) => c.ancestorConstraints)
          .flatMap((c) => c.ancestorConstraints as StateConstraint[]);
        return [
          value,
          [
            ...constraintsAndState,
            {
              name: value.depdendentStateNames[0],
              constraints: ancestorConstraints,
            },
          ],
        ];
      }
      return [value, constraintsAndState];
    }
  }

  if (type.constraint?.generateConstrainedValue) {
    const value = type.constraint.generateConstrainedValue(inputs);
    if (value !== GenerationResult.ValueNotGenerated) {
      return [value, []];
    }
  }

  if (isComplex(type)) {
    return Object.keys(type.fields).reduce(
      ([acc, states], field) => {
        const [value, newStates] = fillInType(
          current,
          [...currentPath, propAccess(field)],
          type.fields[field],
          inputs
        );
        acc[field] = value;
        return [acc, [...states, ...newStates]];
      },
      [{}, []] as [any, StateAndConstraints[]]
    );
  }

  if (isArray(type)) {
    const min = type.constraint?.minItems ?? 0;
    const max = type.constraint?.maxItems ?? 10;
    const count = getRandomInt(
      getGenerationLimitValue(min),
      getGenerationLimitValue(max)
    );
    const mapped = [...Array(count).keys()].map((_, i) =>
      fillInType(
        current,
        [...currentPath, arrayIndexAccess(i)],
        type.inner,
        inputs
      )
    );
    return [
      mapped.map(([value]) => value),
      mapped.flatMap(([, items]) => items),
    ];
  }

  if (isLinkType(type)) {
    const constraint = type.constraint as LinkConstraint<any> | undefined;
    let parentConstraints: StateConstraint[] = [];

    if (constraint?.parentConstraint) {
      const [utils, constraints] = getParentConstraintsUtilsAndResults();
      constraint.parentConstraint(utils, inputs);
      parentConstraints = constraints;
    }

    const constraintsFromChildren = matchingConstraints
      .filter((c) => c.ancestorConstraints)
      .flatMap((c) => c.ancestorConstraints as StateConstraint[]);

    // Constraints from children take preference
    parentConstraints = [...constraintsFromChildren, ...parentConstraints];

    const parentCreateConstraint = current.constraints.find(
      ({ path, creationMode }) => pathMatches(currentPath, path) && creationMode
    );

    const creationMode = parentCreateConstraint?.creationMode ?? type?.mode;

    const shouldCreate = !!(type.required ||
    creationMode === ParentCreationMode.Create
      ? true
      : creationMode === ParentCreationMode.DoNotCreate
      ? false
      : maybeUndefined(true));

    if (!shouldCreate) {
      return [undefined, []];
    }

    const resourceCount = type.resources.length;
    const resourceIndex = getRandomInt(0, resourceCount - 1);
    const parentState = createDesiredState(type.resources[resourceIndex], {});

    const link = (getRuntimeResourceValue as any)(parentState, type.outputKey);
    return [link, [{ state: parentState, constraints: parentConstraints }]];
  }

  return [getValueForPrimativeType(type), []];
}

function fillInInput(
  stateAndConstraints: NewStateAndConstraints,
  input: PropertyDefinition<any>,
  fieldName: string
): [any, StateAndConstraints[]] {
  let currentInput: string | undefined;
  const values = stateAndConstraints.state.inputs;
  let newState: StateAndConstraints[] = [];
  const getForKey = (key: string) => {
    // TODO: Make sure error is reported correctly
    if (currentInput === key) {
      throw new Error(
        `Circular property generation from property '${currentInput}' on resource '${stateAndConstraints.state.resource.name}'`
      );
    }

    const inputDef = stateAndConstraints.state.resource.inputs[key];

    if (key in values) {
      return values[key];
    }

    const [value, parentStates] = fillInType(
      stateAndConstraints,
      [propAccess(key)],
      inputDef.type,
      inputProxy
    );
    newState = [...newState, ...parentStates];
    return (values[key] = value);
  };

  const inputProxy: PropertyValues<PropertyMap> = {};
  for (const prop of Object.keys(stateAndConstraints.state.resource.inputs)) {
    Object.defineProperty(inputProxy, prop, {
      get: () => getForKey(prop),
    });
  }

  const [value, parentStates] = fillInType(
    stateAndConstraints,
    [propAccess(fieldName)],
    input.type,
    inputProxy
  );
  newState = [...newState, ...parentStates];
  return [value, newState];
}

export function fillInDesiredStateTree(
  state: ErasedDesiredState[]
): ErasedDesiredState[] {
  // TODO: Explicit link support
  const newState: NewStateAndConstraints[] = [
    ...state.map((s) => ({ state: s, constraints: [] })),
  ];
  for (const item of newState) {
    const constraints: StateAndConstraints[] = [];
    for (const inputKey of Object.keys(item.state.resource.inputs)) {
      const input = item.state.resource.inputs[inputKey];
      if (!(inputKey in item.state.inputs)) {
        const [value, dependentStates] = fillInInput(
          item,
          input as PropertyDefinition<unknown>,
          inputKey
        );
        item.state.inputs[inputKey] = value;
        for (const state of dependentStates) {
          constraints.push(state);
        }
      }
    }

    for (const constraint of constraints.reverse()) {
      if (constraint.state) {
        newState.push(constraint);
      } else {
        let queuedState: NewStateAndConstraints | undefined = newState.find(
          (s) => s.state.name === constraint.name
        );
        if (!queuedState) {
          queuedState = constraints.find(
            (s) => s.state && s.state.name === constraint.name
          ) as NewStateAndConstraints;
        }

        if (queuedState) {
          for (const parentConstraint of constraint.constraints) {
            queuedState.constraints.push(parentConstraint);
          }
        }
      }
    }
  }

  return newState.map((s) => s.state);
}
