import { faker } from '@faker-js/faker';
import {
  PropertyDefinition,
  PropertyValues,
  PropertyMap,
  PropertyType,
  isNullable,
  isUndefinable,
} from '../resources';

function getValueForType(type: PropertyType): any {
  if (isNullable(type)) {
    const random = Math.random();
    if (isUndefinable(type.inner)) {
      return random < 0.25
        ? undefined
        : random < 0.5
        ? null
        : getValueForType(type.inner.inner);
    }

    return random < 0.5 ? null : getValueForType(type.inner);
  }

  if (isUndefinable(type)) {
    const random = Math.random();
    return random < 0.5 ? undefined : getValueForType(type.inner);
  }

  switch (type) {
    case 'String':
      return `${faker.word.adjective()}  ${faker.word.noun()}`;
    case 'Number':
      return faker.datatype.number();
    case 'Boolean':
      return faker.datatype.boolean();
  }
}

export function getValue(
  input: PropertyDefinition<any>,
  inputs: PropertyValues<PropertyMap>
): any {
  if (input.constraint) {
    return input.constraint.generateConstrainedValue(inputs);
  }

  return getValueForType(input.type);
}
