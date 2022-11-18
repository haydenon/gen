import {
  PropertyDefinition,
  PropertyType,
  isLinkType,
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

function fillInType(
  current: ErasedDesiredState,
  type: PropertyType,
  inputs: PropertyValues<PropertyMap>
): [any, ErasedDesiredState[]] {
  if (isComplex(type)) {
    return Object.keys(type.fields).reduce(
      ([acc, states], field) => {
        const [value, newStates] = fillInType(
          current,
          type.fields[field],
          inputs
        );
        acc[field] = value;
        return [acc, [...states, ...newStates]];
      },
      [{}, []] as [any, ErasedDesiredState[]]
    );
  }

  if (isArray(type)) {
    const min = type.constraint?.minItems ?? 0;
    const max = type.constraint?.maxItems ?? 10;
    const count = getRandomInt(min, max);
    const mapped = [...Array(count).keys()].map(() =>
      fillInType(current, type.inner, inputs)
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
    const resourceCount = type.resources.length;
    const resourceIndex = getRandomInt(0, resourceCount - 1);
    const dependentState = createDesiredState(
      type.resources[resourceIndex],
      {}
    );
    const link = (getRuntimeResourceValue as any)(
      dependentState,
      type.outputKey
    );
    return [link, [dependentState]];
  }

  return [getValueForPrimativeType(type), []];
}

function fillInInput(
  state: ErasedDesiredState,
  input: PropertyDefinition<any>
): [any, ErasedDesiredState[]] {
  let currentInput: string | undefined;
  const values = state.inputs;
  let newState: ErasedDesiredState[] = [];
  const getForKey = (key: string) => {
    // TODO: Make sure error is reported correctly
    if (currentInput === key) {
      throw new Error(
        `Circular property generation from property '${currentInput}' on resource '${state.resource.constructor.name}'`
      );
    }

    const inputDef = state.resource.inputs[key];

    if (key in values) {
      return values[key];
    }

    const [value, dependentState] = fillInType(
      state,
      inputDef.type,
      inputProxy
    );
    newState = [...newState, ...dependentState];
    return (values[key] = value);
  };

  const inputProxy: PropertyValues<PropertyMap> = {};
  for (const prop of Object.keys(state.resource.inputs)) {
    Object.defineProperty(inputProxy, prop, {
      get: () => getForKey(prop),
    });
  }

  const [value, dependentState] = fillInType(state, input.type, inputProxy);
  newState = [...newState, ...dependentState];
  return [value, newState];
}

export function fillInDesiredStateTree(
  state: ErasedDesiredState[]
): ErasedDesiredState[] {
  // TODO: Explicit link support
  const newState: ErasedDesiredState[] = [...state];
  for (const item of newState) {
    for (const inputKey of Object.keys(item.resource.inputs)) {
      const input = item.resource.inputs[inputKey];
      if (!(inputKey in item.inputs)) {
        const [value, dependentStates] = fillInInput(item, input);
        item.inputs[inputKey] = value;
        for (const state of dependentStates) {
          newState.push(state);
        }
      }
    }
  }

  return newState;
}
