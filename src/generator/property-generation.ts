import { faker } from '@faker-js/faker';
import {
  PropertyDefinition,
  PropertyType,
  isNullable,
  isUndefinable,
  isStr,
  isBool,
  isNum,
  isLinkType,
  isComplex,
  isArray,
} from '../resources/properties';
import { DesiredState, createDesiredState } from '../resources/desired-state';
import { PropertyValues, PropertyMap } from '../resources/resource';
import { ResourceLink } from './generator';

const getRandomNumber = (min: number, max: number): number => {
  const difference = max - min;
  return Math.floor(Math.random() * difference) + min;
};

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
    const random = Math.random();
    if (isUndefinable(type.inner)) {
      return random < 0.25
        ? undefined
        : random < 0.5
        ? null
        : getValueForSimpleType(type.inner.inner);
    }

    return random < 0.5 ? null : getValueForSimpleType(type.inner);
  }

  if (isUndefinable(type)) {
    const random = Math.random();
    return random < 0.5 ? undefined : getValueForSimpleType(type.inner);
  }

  if (isStr(type)) {
    const min = type.constraint?.maxLength ?? 10;
    const max = type.constraint?.minLength ?? 20;
    const length = getRandomNumber(min, max);
    return getStringOfLength(length);
  } else if (isNum(type)) {
    const min = type.constraint?.min;
    const max = type.constraint?.max;
    const precision = type.constraint?.precision;
    const options = { min, max, precision };
    return type.constraint?.float
      ? faker.datatype.float(options)
      : faker.datatype.number(options);
  } else if (isBool(type)) {
    return faker.datatype.boolean();
  }
}

function fillInType(
  type: PropertyType,
  inputs: PropertyValues<PropertyMap>
): [any, DesiredState[]] {
  if (isComplex(type)) {
    return Object.keys(type.fields).reduce(
      ([acc, states], field) => {
        const [value, newStates] = fillInType(type.fields[field], inputs);
        acc[field] = value;
        return [acc, [...states, ...newStates]];
      },
      [{}, []] as [any, DesiredState[]]
    );
  }

  if (isArray(type)) {
    const min = type.constraint?.minItems ?? 0;
    const max = type.constraint?.maxItems ?? 10;
    const count = getRandomNumber(min, max);
    const mapped = [...Array(count).keys()].map(() =>
      fillInType(type.inner, inputs)
    );
    return [
      mapped.flatMap(([value]) => value),
      mapped.flatMap(([, items]) => items),
    ];
  }

  if (type.constraint?.generateConstrainedValue) {
    return [type.constraint?.generateConstrainedValue(inputs), []];
  } else if (isLinkType(type)) {
    const resourceCount = type.resources.length;
    const resourceIndex = Math.floor(Math.random() * resourceCount);
    const dependentState = createDesiredState(
      type.resources[resourceIndex],
      {}
    );
    const link = new ResourceLink(dependentState, type.outputAccessor);
    return [link, [dependentState]];
  }

  return [getValueForSimpleType(type), []];
}

function fillInInput(
  state: DesiredState,
  input: PropertyDefinition<any>
): [any, DesiredState[]] {
  let currentInput: string | undefined;
  const values = state.inputs;
  let newState: DesiredState[] = [];
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

    const [value, dependentState] = fillInType(inputDef.type, inputProxy);
    newState = [...newState, ...dependentState];
    return (values[key] = value);
  };

  const inputProxy: PropertyValues<PropertyMap> = {};
  for (const prop of Object.keys(state.resource.inputs)) {
    Object.defineProperty(inputProxy, prop, {
      get: () => getForKey(prop),
    });
  }

  const [value, dependentState] = fillInType(input.type, inputProxy);
  newState = [...newState, ...dependentState];
  return [value, newState];
}

export function fillInDesiredStateTree(state: DesiredState[]): DesiredState[] {
  const newState = [...state];
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
