import { faker } from '@faker-js/faker';
import {
  bool,
  date,
  float,
  int,
  nullable,
  string,
  undefinable,
} from '../../resources';
import { getValueForPrimativeType } from './primatives.generator';
import { runTimes } from '../../../test';
import { range } from '../../utilities';

describe('Getting values for primative types', () => {
  describe('Strings', () => {
    test('creates strings with correct lengths', () => {
      runTimes(500, () => {
        // Arrange
        const length = faker.datatype.number({ min: 1, max: 5000 });

        // Act
        const value = getValueForPrimativeType(
          string({ minLength: length, maxLength: length })
        );

        // Assert
        expect(typeof value).toBe('string');
        expect(value.length).toBe(length);
      });
    });

    test('creates short strings', () => {
      runTimes(20, (i) => {
        // Arrange
        const length = faker.datatype.number({ min: i, max: i });

        // Act
        const value = getValueForPrimativeType(
          string({ minLength: length, maxLength: length })
        );

        // Assert
        expect(typeof value).toBe('string');
        expect(value.length).toBe(length);
      });
    });
  });

  describe('Bools', () => {
    test('creates booleans', () => {
      // Arrange
      const validValues = [true, false];

      // Act
      const randomBooleanValues = range(30).map(() =>
        getValueForPrimativeType(bool())
      );

      // Assert
      expect(
        validValues.every((value) => randomBooleanValues.includes(value))
      ).toBe(true);
      expect(
        randomBooleanValues.every((value) => validValues.includes(value as any))
      ).toBe(true);
    });
  });

  describe('Nullable and undefinable', () => {
    test('undefinable sometimes returns undefined', () => {
      // Act
      const randomValues: (number | undefined)[] = range(80).map(() =>
        getValueForPrimativeType(undefinable(int()))
      );

      // Assert
      expect(randomValues.some((value) => value === undefined)).toBe(true);
      expect(randomValues.some((value) => typeof value === 'number')).toBe(
        true
      );
      expect(
        randomValues.every(
          (value) => value === undefined || typeof value === 'number'
        )
      ).toBe(true);
    });

    test('nullable sometimes returns null', () => {
      // Act
      const randomValues: (number | null)[] = range(80).map(() =>
        getValueForPrimativeType(nullable(int()))
      );

      // Assert
      expect(randomValues.some((value) => value === null)).toBe(true);
      expect(randomValues.some((value) => typeof value === 'number')).toBe(
        true
      );
      expect(
        randomValues.every(
          (value) => value === null || typeof value === 'number'
        )
      ).toBe(true);
    });

    test('nullable and undefinable sometimes returns null and undefined', () => {
      // Act
      const randomValues: (number | undefined | null)[] = range(80).map(() =>
        getValueForPrimativeType(nullable(undefinable(int())))
      );

      // Assert

      expect(randomValues.some((value) => value === null)).toBe(true);
      expect(randomValues.some((value) => value === undefined)).toBe(true);
      expect(randomValues.some((value) => typeof value === 'number')).toBe(
        true
      );
      expect(
        randomValues.every(
          (value) =>
            value === undefined || value === null || typeof value === 'number'
        )
      ).toBe(true);
    });
  });

  describe('Numbers', () => {
    test('generates ints for int type', () => {
      runTimes(50, () => {
        // Act
        const result = getValueForPrimativeType(int());

        // Assert
        expect(result % 1).toBeCloseTo(0);
      });
    });

    test('generates floats for float type', () => {
      // Act
      const results = range(10).map(() => getValueForPrimativeType(float()));

      // Assert
      expect(results.some((r) => r % 1 !== 0)).toBe(true);
    });

    test('generates value in range for int type', () => {
      runTimes(50, () => {
        // Arrange
        const min = 89123;
        const max = 89127;

        // Act
        const result = getValueForPrimativeType(int({ min, max }));

        // Assert
        expect(result).toBeGreaterThanOrEqual(min);
        expect(result).toBeLessThanOrEqual(max);
      });
    });

    test('generates value in range for float type', () => {
      runTimes(50, () => {
        // Arrange
        const min = 89123;
        const max = 89127;

        // Act
        const result = getValueForPrimativeType(float({ min, max }));

        // Assert
        expect(result).toBeGreaterThanOrEqual(min);
        expect(result).toBeLessThanOrEqual(max);
      });
    });

    test('generates floats with provided precision', () => {
      runTimes(50, () => {
        // Act
        const result = getValueForPrimativeType(
          float({ min: 0, max: 5, precision: 0.2 })
        );

        // Assert
        expect((result * 10) % 1).toBeCloseTo(0);
        expect(result / 0.2).toBeCloseTo(Math.round(result / 0.2));
      });
    });
  });

  describe('Dates', () => {
    test('generates dates', () => {
      // Act
      const result = getValueForPrimativeType(date());

      // Assert
      expect(result).toBeInstanceOf(Date);
    });

    test('generates dates', () => {
      runTimes(50, () => {
        // Arrange
        const minDate = new Date(2020, 2, 1, 8, 10, 20);
        const maxDate = new Date(2020, 2, 1, 8, 10, 40);

        // Act
        const result = getValueForPrimativeType(date({ minDate, maxDate }));

        // Assert
        expect(result.getTime()).toBeGreaterThanOrEqual(minDate.getTime());
        expect(result.getTime()).toBeLessThanOrEqual(maxDate.getTime());
      });
    });
  });
});
