export const getRandomBool = (): boolean => Math.random() < 0.5;

export const getRandomInt = (min: number, max: number): number =>
  Math.floor(getRandomFloat(min, max + 1)); // Need +1 to be inclusive of max

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
