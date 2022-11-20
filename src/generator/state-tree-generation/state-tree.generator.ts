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
import { getRandomInt } from '../../utilities';
import { getValueForPrimativeType } from './primatives.generator';
import { getRuntimeResourceValue } from '../../resources/runtime-values';
import { GenerationResult } from '../../resources/properties';
import {
  getParentConstraintsUtilsAndResults,
  isLinkType,
  LinkConstraint,
} from '../../resources/properties/links';
import {
  arrayIndexAccess,
  pathMatches,
  propAccess,
  PropertyPathSegment,
  StateAndConstraints,
  StateConstraint,
} from '../../resources/state-constraints';

function fillInType(
  current: StateAndConstraints,
  currentPath: PropertyPathSegment[],
  type: PropertyType,
  inputs: PropertyValues<PropertyMap>
): [any, StateAndConstraints[]] {
  const matchingConstraint = current.constraints.find(({ path }) =>
    pathMatches(currentPath, path)
  );
  if (matchingConstraint && matchingConstraint.value) {
    return [matchingConstraint.value, []];
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
    const count = getRandomInt(min, max);
    const mapped = [...Array(count).keys()].map((_, i) =>
      fillInType(
        current,
        [...currentPath, arrayIndexAccess(i)],
        type.inner,
        inputs
      )
    );
    return [
      mapped.flatMap(([value]) => value),
      mapped.flatMap(([, items]) => items),
    ];
  }

  if (type.constraint?.generateConstrainedValue) {
    const value = type.constraint.generateConstrainedValue(inputs);
    if (value !== GenerationResult.ValueNotGenerated) {
      return [value, []];
    }
  }

  if (isLinkType(type)) {
    const constraint = type.constraint as LinkConstraint<any> | undefined;
    let parentConstraints: StateConstraint[] = [];

    if (constraint?.parentConstraint) {
      const [utils, constraints] = getParentConstraintsUtilsAndResults();
      constraint.parentConstraint(utils, inputs);
      parentConstraints = constraints;
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
  stateAndConstraints: StateAndConstraints,
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
        `Circular property generation from property '${currentInput}' on resource '${stateAndConstraints.state.resource.constructor.name}'`
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
  const newState: StateAndConstraints[] = [
    ...state.map((s) => ({ state: s, constraints: [] })),
  ];
  for (const item of newState) {
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
          newState.push(state);
        }
      }
    }
  }

  return newState.map((s) => s.state);
}
