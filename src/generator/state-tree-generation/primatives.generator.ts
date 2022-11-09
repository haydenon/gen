import { faker } from '@faker-js/faker';
import {
  PropertyType,
  isNullable,
  isUndefinable,
  isStr,
  isInt,
  isFloat,
  isBool,
  isDate,
} from '../../resources/properties';
import {
  maybeNullOrUndefined,
  maybeNull,
  maybeUndefined,
  getRandomInt,
} from '../../utilities';

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

export function getValueForPrimativeType(type: PropertyType): any {
  if (isNullable(type)) {
    if (isUndefinable(type.inner)) {
      const innerType = type.inner.inner;
      return maybeNullOrUndefined(() => getValueForPrimativeType(innerType));
    }

    return maybeNull(() => getValueForPrimativeType(type.inner));
  }

  if (isUndefinable(type)) {
    return maybeUndefined(() => getValueForPrimativeType(type.inner));
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
