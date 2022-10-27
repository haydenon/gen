import { faker } from '@faker-js/faker';
import {
  PropertyDefinition,
  PropertyType,
  isNullable,
  isUndefinable,
  isStr,
  isBool,
  isInt,
  isFloat,
  isDate,
  isLinkType,
  isComplex,
  isArray,
  GenerationResult,
} from '../resources/properties';
import { DesiredState, createDesiredState } from '../resources/desired-state';
import { PropertyValues, PropertyMap } from '../resources/resource';
import { ResourceLink } from './generator';
import {
  getRandomInt,
  maybeNull,
  maybeNullOrUndefined,
  maybeUndefined,
} from '../utilities';

function getStringOfLength(length: number): string {
  if (length < 3) {
    return faker.datatype.string(length);
  }
  if (length < 9) {
    return faker.word.noun(length);
  }

  const minLength = 3;
  const maxLength = 8;
  if (length > maxLength * 4) {
    // TODO: Better long text. This doesn't adhere to constraints yet
    return faker.lorem.paragraphs(length / 50);
  }
  let count = 0;
  let smallestWord = 0;
  let desiredLength = 0;
  for (desiredLength = maxLength; desiredLength >= minLength; desiredLength--) {
    const numFit = (length + 1) / (desiredLength + 1);
    if (numFit % 1 === 0) {
      count = numFit;
      smallestWord = desiredLength;
      break;
    }

    const remainder = length - Math.floor(numFit) * (desiredLength + 1);
    if (remainder >= minLength && remainder <= maxLength) {
      count = numFit + 1;
      smallestWord = remainder;
      break;
    }
  }

  let string = '';

  for (let i = 0; i < count - 2; i++) {
    string += `${faker.word.adjective(desiredLength)} `;
  }

  if (count > 1) {
    string += `${faker.word.adjective(smallestWord)} `;
  }

  string += faker.word.noun(desiredLength);

  return string;
}

function getValueForSimpleType(type: PropertyType): any {
  if (isNullable(type)) {
    if (isUndefinable(type.inner)) {
      const innerType = type.inner.inner;
      return maybeNullOrUndefined(() => getValueForSimpleType(innerType));
    }

    return maybeNull(() => getValueForSimpleType(type.inner));
  }

  if (isUndefinable(type)) {
    return maybeUndefined(() => getValueForSimpleType(type.inner));
  }

  if (isStr(type)) {
    const min = type.constraint?.maxLength ?? 10;
    const max = type.constraint?.minLength ?? 20;
    const length = getRandomInt(min, max);
    return getStringOfLength(length);
  } else if (isInt(type) || isFloat(type)) {
    const min = type.constraint?.min;
    const max = type.constraint?.max;
    const precision = type.constraint?.precision;
    const options = { min, max, precision };
    return isFloat(type)
      ? faker.datatype.float(options)
      : faker.datatype.number(options);
  } else if (isBool(type)) {
    return faker.datatype.boolean();
  } else if (isDate(type)) {
    const min = type.constraint?.minDate?.getTime();
    const max = type.constraint?.maxDate?.getTime();
    return faker.datatype.datetime({
      min,
      max,
    });
  }
}

interface DesiredWithChildren {
  desired: DesiredState;
  children: DesiredState[];
}

function fillInType(
  current: DesiredState,
  type: PropertyType,
  inputs: PropertyValues<PropertyMap>,
  children: DesiredState[]
): [any, DesiredWithChildren[]] {
  if (isComplex(type)) {
    return Object.keys(type.fields).reduce(
      ([acc, states], field) => {
        const [value, newStates] = fillInType(
          current,
          type.fields[field],
          inputs,
          children
        );
        acc[field] = value;
        return [acc, [...states, ...newStates]];
      },
      [{}, []] as [any, DesiredWithChildren[]]
    );
  }

  if (isArray(type)) {
    const min = type.constraint?.minItems ?? 0;
    const max = type.constraint?.maxItems ?? 10;
    const count = getRandomInt(min, max);
    const mapped = [...Array(count).keys()].map(() =>
      fillInType(current, type.inner, inputs, children)
    );
    return [
      mapped.flatMap(([value]) => value),
      mapped.flatMap(([, items]) => items),
    ];
  }

  if (type.constraint?.generateConstrainedValue) {
    const value = type.constraint?.generateConstrainedValue(inputs, {
      children,
    });
    if (value !== GenerationResult.ValueNotGenerated) {
      return [value, []];
    }
  }

  if (isLinkType(type)) {
    const resourceCount = type.resources.length;
    const resourceIndex = Math.floor(Math.random() * resourceCount);
    const dependentState = createDesiredState(
      type.resources[resourceIndex],
      {}
    );
    const link = new ResourceLink(dependentState, type.outputAccessor);
    const newChildren = [current, ...children];
    return [link, [{ desired: dependentState, children: newChildren }]];
  }

  return [getValueForSimpleType(type), []];
}

function fillInInput(
  state: DesiredState,
  input: PropertyDefinition<any>,
  children: DesiredState[]
): [any, DesiredWithChildren[]] {
  let currentInput: string | undefined;
  const values = state.inputs;
  let newState: DesiredWithChildren[] = [];
  const getForKey = (key: string) => {
    // TODO: Make sure error is reported correctly
    if (currentInput === key) {
      throw new Error(
        `Circular property generation from property '${currentInput}' on resource '${state.resource.constructor.name}'`
      );
    }

    const inputDef = state.resource.inputs[key];
    if (!inputDef) {
      throw new Error(
        `Property '${currentInput}' does not exist on resource '${state.resource.constructor.name}'`
      );
    }

    if (key in values) {
      return values[key];
    }

    const [value, dependentState] = fillInType(
      state,
      inputDef.type,
      inputProxy,
      children
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

  const [value, dependentState] = fillInType(
    state,
    input.type,
    inputProxy,
    children
  );
  newState = [...newState, ...dependentState];
  return [value, newState];
}

export function fillInDesiredStateTree(state: DesiredState[]): DesiredState[] {
  // TODO: Explicit link support
  const newState: DesiredWithChildren[] = [
    ...state.map((desired) => ({ desired, children: [] })),
  ];
  for (const item of newState) {
    for (const inputKey of Object.keys(item.desired.resource.inputs)) {
      const input = item.desired.resource.inputs[inputKey];
      if (!(inputKey in item.desired.inputs)) {
        const [value, dependentStates] = fillInInput(
          item.desired,
          input,
          item.children
        );
        item.desired.inputs[inputKey] = value;
        for (const state of dependentStates) {
          newState.push(state);
        }
      }
    }
  }

  return newState.map((s) => s.desired);
}
