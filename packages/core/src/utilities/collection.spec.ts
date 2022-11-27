import { isOneOf, oneOf, range } from './collection';

describe('Collection utilities', () => {
  test('range returns the correct count and values starting from 0 with a single argument', () => {
    // Act
    const output = range(5);

    // Assert
    expect(output).toEqual([0, 1, 2, 3, 4]);
  });

  test('range returns the correct count and values starting from min going to max exclusive with two arguments', () => {
    // Act
    const output = range(5, 10);

    // Assert
    expect(output).toEqual([5, 6, 7, 8, 9]);
  });

  enum Values {
    Two = 2,
    SixtySeven = 67,
    Eighteen = 18,
    Fifteen = 'Negative Fifteen',
    OneHundredAndSeventeen = 117,
  }

  test('oneOf returns a random value in array', () => {
    // Arrange
    const values = [2, 67, 18, -15, 117];

    // Act
    const randomValues = range(500).map(() => oneOf(values));

    // Assert
    expect(values.every((value) => randomValues.includes(value)));
    expect(randomValues.every((value) => values.includes(value)));
  });

  test('oneOf returns a random value in map', () => {
    // Arrange
    const values = {
      two: 2,
      sixtySeven: 67,
      eighteen: 18,
      negativeFifteen: -15,
      oneHundredAndSeventeen: 117,
    };
    const validValues = [2, 67, 18, -15, 117];

    // Act
    const randomValues = range(500).map(() => oneOf(values));

    // Assert
    expect(validValues.every((value) => randomValues.includes(value)));
    expect(randomValues.every((value) => validValues.includes(value)));
  });

  test('oneOf returns a random value in enum', () => {
    // Arrange
    const validValues: (number | string)[] = [
      2,
      67,
      18,
      'Negative Fifteen',
      117,
    ];

    // Act
    const randomValues = range(500).map(() => oneOf(Values));

    // Assert
    expect(validValues.every((value) => randomValues.includes(value)));
    expect(randomValues.every((value) => validValues.includes(value)));
  });

  const valuesCases: [any, string][] = [
    [[2, 67, 18, -15, 117], 'array'],
    [
      {
        two: 2,
        sixtySeven: 67,
        eighteen: 18,
        negativeFifteen: -15,
        oneHundredAndSeventeen: 117,
      },
      'map',
    ],
  ];

  valuesCases.forEach(([values, name]) =>
    test(`isOneOf returns true for valid ${name} values`, () => {
      // Arrange
      const validValues = [2, 67, 18, -15, 117];

      for (const value of validValues) {
        // Act
        const isValid = isOneOf(values, value);

        // Assert
        expect(isValid).toBe(true);
      }
    })
  );

  const allCases = [...valuesCases, [Values, 'enum'] as [any, string]];
  allCases.forEach(([values, name]) =>
    test(`isOneOf returns false for invalid ${name} values`, () => {
      // Act
      const isValid = isOneOf(values, 18923);

      // Assert
      expect(isValid).toBe(false);
    })
  );
});
