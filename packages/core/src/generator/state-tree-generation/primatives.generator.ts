import { faker } from '@faker-js/faker';
import { paragraph } from 'txtgen';
import {
  PropertyType,
  isNullable,
  isUndefinable,
  isStr,
  isInt,
  isFloat,
  isBool,
  isDate,
} from '../../resources/properties/properties';
import {
  maybeNullOrUndefined,
  maybeNull,
  maybeUndefined,
  getRandomInt,
} from '../../utilities';

const MIN_LENGTH = 3;
const MAX_LENGTH = 8;

const LONG_TEXT_THRESHOLD = MAX_LENGTH * 6;

function getStringOfLength(length: number, generateLongerText = true): string {
  if (length === 0) {
    return '';
  } else if (length < MIN_LENGTH) {
    return faker.datatype.string(length);
  } else if (length <= MAX_LENGTH) {
    return faker.word.noun(length);
  }

  if (length >= LONG_TEXT_THRESHOLD && generateLongerText) {
    return generateLongText(length);
  }
  let count = 0;
  let smallestWord = 0;
  let desiredLength = 0;
  for (
    desiredLength = MAX_LENGTH;
    desiredLength >= MIN_LENGTH;
    desiredLength--
  ) {
    const numFit = (length + 1) / (desiredLength + 1);
    if (numFit % 1 === 0) {
      count = numFit;
      smallestWord = desiredLength;
      break;
    }

    const remainder = length - Math.floor(numFit) * (desiredLength + 1);
    if (remainder >= MIN_LENGTH && remainder <= MAX_LENGTH) {
      count = Math.floor(numFit) + 1;
      smallestWord = remainder;
      break;
    }
  }

  if (desiredLength >= MIN_LENGTH) {
    let string = '';

    for (let i = 0; i < count - 2; i++) {
      string += `${faker.word.adjective(desiredLength)} `;
    }

    if (count > 1) {
      string += `${faker.word.adjective(smallestWord)} `;
    }

    string += faker.word.noun(desiredLength);

    return string;
  } else {
    // Failed to split up the word nicely.
    let remainingLength = length - 7;
    const noun = faker.word.noun(6);

    let text = '';

    while (remainingLength > 7) {
      text += `${faker.word.adjective(6)} `;
      remainingLength -= 7;
    }
    text += noun;

    if (remainingLength === 0) {
      return text;
    } else if (remainingLength === 1) {
      return `${text} `;
    }

    text += ' ';

    text += faker.datatype.string(remainingLength);
    return text;
  }
}

const AVG_SENTENCE_LENGTH = 150;
function generateLongText(length: number): string {
  let text = '';
  if (length > 2000) {
    text = getStringOfLength(length - 2000);
  }

  const sentences = length / AVG_SENTENCE_LENGTH + 5;
  text = paragraph(sentences) + text;

  const threshold = length - 3;
  if (text.length <= threshold) {
    const remainingLength = length - text.length - 2;
    const a = getStringOfLength(remainingLength, false);
    return `${text} ${a}.`;
  }

  let lastSpaceInRange = text.length;
  let i = text.length - 1;
  while (lastSpaceInRange >= threshold) {
    if (text[i] === ' ') {
      lastSpaceInRange = i;
    }
    i--;
  }

  // Space is removed from end of text
  const shortenedText = text.substring(0, lastSpaceInRange);
  const remainingLength = length - shortenedText.length - 2;
  return `${shortenedText} ${getStringOfLength(remainingLength, false)}.`;
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
