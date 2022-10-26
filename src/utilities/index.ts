export const getRandomBool = (): boolean => Math.random() < 0.5;

export const getRandomInt = (min: number, max: number): number =>
  Math.floor(getRandomFloat(min, max));

export const getRandomFloat = (min: number, max: number): number => {
  const difference = max - min;
  return Math.random() * difference + min;
};

const nullUndefinedRate = 0.3;

const getValue = <T>(value: T | (() => T)): T =>
  value instanceof Function ? value() : value;

export const maybeUndefined = <T>(value: T | (() => T)): T | undefined => {
  return Math.random() > nullUndefinedRate ? getValue(value) : undefined;
};

export const maybeNull = <T>(value: T | (() => T)): T | null => {
  return Math.random() > nullUndefinedRate ? getValue(value) : null;
};

export const maybeNullOrUndefined = <T>(
  value: T | (() => T)
): T | null | undefined => {
  const rand = Math.random();
  if (rand < nullUndefinedRate / 2) {
    return null;
  } else if (rand < nullUndefinedRate) {
    return undefined;
  } else {
    return getValue(value);
  }
};

type EnumObject<T> = T extends number | string
  ? { [key: string]: number | string }
  : never;

export type LookupValues<T> = T[] | { [index: string]: T } | EnumObject<T>;

const getLookupValues = <T>(values: LookupValues<T>): T[] => {
  if (values instanceof Array) {
    return values;
  }

  return Object.keys(values)
    .filter((key) => isNaN(parseInt(key)))
    .map((key) => values[key] as T);
};

export const oneOf = <T>(values: LookupValues<T>): T => {
  const allValues = getLookupValues(values);
  const index = getRandomInt(0, allValues.length - 1);
  return allValues[index];
};

export const isOneOf = <T>(values: LookupValues<T>, value: T): boolean =>
  getLookupValues(values).includes(value);

export const truncate = (str: string, length: number): string =>
  str.length > length ? str.substring(0, length) : str;
