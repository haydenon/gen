import {
  PropertyDefinition,
  PropertyType,
  isComplex,
  isArray,
  Value,
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
  isLinkType,
  LinkConstraint,
  ParentConstraints,
  ParentCreationMode as StateCreationConstraint,
} from '../../resources/properties/links';

class ParentProxyHandler {
  public proxy?: typeof Proxy;
  public paths: (string | number | symbol | AllIndexMarker)[] = [];

  get(_: any, property: string | number | symbol): typeof Proxy {
    const asInt =
      typeof property === 'string'
        ? parseInt(property)
        : typeof property === 'number'
        ? property
        : NaN;
    if (!isNaN(asInt)) {
      this.paths.push(asInt);
    } else {
      this.paths.push(property);
    }
    if (!this.proxy) {
      throw new Error('Proxy incorrectly configured');
    }
    return this.proxy;
  }
}

class AllIndexMarker {}

const getParentConstraintsUtilsAndResults = (): [
  ParentConstraints<any>,
  StateConstraint[]
] => {
  const results: StateConstraint[] = [];
  return [
    {
      setValue(accessor, value, mode) {
        const handler = new ParentProxyHandler();
        const parentValueProxy = new Proxy({}, handler);
        handler.proxy = parentValueProxy;
        accessor(parentValueProxy as any);
        const path: PropertyPathSegment[] = handler.paths.map((p) =>
          // TODO: Support all indexes for arrays
          typeof p === 'number'
            ? arrayIndexAccess(p)
            : p instanceof AllIndexMarker
            ? arrayIndexAccess('all')
            : propAccess(p)
        );
        results.push({
          path,
          value,
          mode,
        });
      },
      doNotCreateParent() {
        throw new Error('TODO!');
      },
      all(value: any): any {
        if (value instanceof ParentProxyHandler) {
          value.paths.push(new AllIndexMarker());
          return value;
        }

        throw new Error('Expected a valid parent value to be passed in');
      },
    },
    results,
  ];
};

enum PropertyPathType {
  PropertyAccess,
  ArrayIndexAccess,
}
interface PropertyAccess {
  type: PropertyPathType.PropertyAccess;
  propertyName: string;
}
const propAccess = (prop: string | symbol): PropertyAccess => ({
  type: PropertyPathType.PropertyAccess,
  propertyName: prop.toString(),
});
interface ArrayIndexAccess {
  type: PropertyPathType.ArrayIndexAccess;
  indexAccess: number | 'all';
}
const arrayIndexAccess = (indexAccess: number | 'all'): ArrayIndexAccess => ({
  type: PropertyPathType.ArrayIndexAccess,
  indexAccess,
});
type PropertyPathSegment = PropertyAccess | ArrayIndexAccess;

interface StateConstraint {
  path: PropertyPathSegment[];
  value: Value<any>;
  mode: StateCreationConstraint;
}

interface StateAndConstraints {
  state: ErasedDesiredState;
  constraints: StateConstraint[];
}

const pathMatches = (
  p1: PropertyPathSegment[],
  p2: PropertyPathSegment[]
): boolean => {
  if (p1.length !== p2.length) {
    return false;
  }
  if (p1.length === 0) {
    return true;
  }

  const [next1, ...rest1] = p1;
  const [next2, ...rest2] = p2;

  if (
    next1.type === PropertyPathType.ArrayIndexAccess &&
    next2.type === PropertyPathType.ArrayIndexAccess
  ) {
    if (
      next1.indexAccess === 'all' ||
      next2.indexAccess === 'all' ||
      next1.indexAccess === next2.indexAccess
    ) {
      return pathMatches(rest1, rest2);
    } else {
      return false;
    }
  }

  if (
    next1.type === PropertyPathType.PropertyAccess &&
    next2.type === PropertyPathType.PropertyAccess
  ) {
    if (next1.propertyName === next2.propertyName) {
      return pathMatches(rest1, rest2);
    } else {
      return false;
    }
  }

  return false;
};

function fillInType(
  current: StateAndConstraints,
  currentPath: PropertyPathSegment[],
  type: PropertyType,
  inputs: PropertyValues<PropertyMap>
): [any, StateAndConstraints[]] {
  const matchingConstraint = current.constraints.find(({ path }) =>
    pathMatches(currentPath, path)
  );
  if (matchingConstraint) {
    // TODO: Nested children constraints?
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
        const [value, dependentStates] = fillInInput(item, input, inputKey);
        item.state.inputs[inputKey] = value;
        for (const state of dependentStates) {
          newState.push(state);
        }
      }
    }
  }

  return newState.map((s) => s.state);
}
