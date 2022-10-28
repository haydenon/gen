import { range } from './collection';
import {
  getRandomBool,
  getRandomInt,
  maybeNull,
  maybeNullOrUndefined,
  maybeUndefined,
} from './random';

describe('Random utilities', () => {
  test('getRandomBool returns a random bool', () => {
    // Arrange
    const validValues = [true, false];

    // Act
    const randomBooleanValues = range(50).map(getRandomBool);

    // Assert
    expect(validValues.every((value) => randomBooleanValues.includes(value)));
    expect(randomBooleanValues.every((value) => validValues.includes(value)));
  });

  test('getRandomInt returns a random int', () => {
    // Arrange
    const validValues = [2, 3, 4, 5, 6, 7];

    // Act
    const randomIntValues = range(500).map(() => getRandomInt(2, 7));

    // Assert
    expect(validValues.every((value) => randomIntValues.includes(value)));
    expect(randomIntValues.every((value) => validValues.includes(value)));
  });

  test('getRandomFloat returns a random float', () => {
    // Arrange
    const min = 16;
    const max = 87;

    // Act
    const randomFloatValues = range(500).map(() => getRandomInt(min, max));

    // Assert
    for (const randomValue of randomFloatValues) {
      expect(randomValue).toBeGreaterThanOrEqual(min);
      expect(randomValue).toBeLessThanOrEqual(max);
    }
  });

  test('maybeUndefined sometimes returns undefined', () => {
    // Arrange
    const value = 6;
    const validValues = [value, undefined];

    // Act
    const randomValues: (number | undefined)[] = range(80).map(() =>
      maybeUndefined(value)
    );

    // Assert
    expect(validValues.every((value) => randomValues.includes(value)));
    expect(randomValues.every((value) => validValues.includes(value)));
  });

  test('maybeNull sometimes returns null', () => {
    // Arrange
    const value = 6;
    const validValues = [value, null];

    // Act
    const randomValues: (number | null)[] = range(80).map(() =>
      maybeNull(value)
    );

    // Assert
    expect(validValues.every((value) => randomValues.includes(value)));
    expect(randomValues.every((value) => validValues.includes(value)));
  });

  test('maybeNullOrUndefined sometimes returns null and undefined', () => {
    // Arrange
    const value = 6;
    const validValues = [value, undefined, null];

    // Act
    const randomValues: (number | undefined | null)[] = range(80).map(() =>
      maybeNullOrUndefined(value)
    );

    // Assert
    expect(validValues.every((value) => randomValues.includes(value)));
    expect(randomValues.every((value) => validValues.includes(value)));
  });
});
