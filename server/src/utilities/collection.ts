import { getRandomInt } from './random';

export function range(count: number): number[];
export function range(min: number, max: number): number[];
export function range(min: number, max?: number): number[] {
  if (max === undefined) {
    return [...Array(min).keys()];
  }

  return [...Array(max - min).keys()].map((num) => num + min);
}

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
