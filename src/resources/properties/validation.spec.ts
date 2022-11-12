import { MockBase } from '../../../test';
import { InputValues } from '../resource';
import {
  array,
  bool,
  complex,
  constrain,
  date,
  def,
  float,
  int,
  nullable,
  PropertyType,
  RuntimeValue,
  str,
  undefinable,
} from './properties';
import {
  getBaseError,
  validateInputValue,
  validateInputValues,
} from './validation';

describe('validateInputValues', () => {
  test('returns errors for multiple invalid inputs', () => {
    // Arrange
    const name = 'Test';
    const values: Partial<InputValues<MockBase>> = {
      text: 1 as any,
      number: true as any,
    };

    // Act
    const result = validateInputValues(name, new MockBase(), values);

    // Assert
    expect(result).toBeInstanceOf(Array);
    expect(result).toEqual([
      new Error(`${getBaseError(name, 'text')} is not of type 'string'`),
      new Error(`${getBaseError(name, 'number')} is not of type 'number'`),
    ]);
  });

  test('does not error when no value provided', () => {
    // Arrange
    const name = 'Test';
    const values: Partial<InputValues<MockBase>> = {};

    // Act
    const result = validateInputValues(name, new MockBase(), values);

    // Assert
    expect(result).toEqual({});
  });

  test('returns the inputs when valid', () => {
    // Arrange
    const name = 'Test';
    const values: Partial<InputValues<MockBase>> = {
      text: 'Hello',
      boolean: true,
      number: 3,
    };

    // Act
    const result = validateInputValues(name, new MockBase(), values);

    // Assert
    expect(result).toEqual(values);
  });

  test('strips unknown values', () => {
    // Arrange
    const name = 'Test';
    const values: Partial<InputValues<MockBase>> = {
      text: 'Hello',
      boolean: true,
      number: 3,
      other: 'Another value',
    } as any;

    // Act
    const result = validateInputValues(name, new MockBase(), values);

    // Assert
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { other, ...expected } = values as any;
    expect(result).toEqual(expected);
  });
});

describe('validateInputValue', () => {
  const name = 'Test';
  const input = 'Input';

  test('returns value for valid properties', () => {
    // Arrange
    const cases: [any, PropertyType][] = [
      [true, bool()],
      [new Date(), date()],
      ['hello', str()],
      [8, int()],
      [5.2, float()],
      [5, nullable(int())],
      [null, nullable(int())],
      [5, undefinable(int())],
      [undefined, undefinable(int())],
      [[1], array(int())],
      [{ text: 'value' }, complex<{ text: string }>({ text: str() })],
    ];

    for (const [validValue, type] of cases) {
      // Act
      const result = validateInputValue(
        name,
        input,
        def<any>(type as any),
        validValue
      );

      // Assert
      expect(result).toEqual(validValue);
    }
  });

  test('returns error for invalid bool properties', () => {
    // Arrange
    const invalid = [new Date(), 'hello', 1, [], {}, null, undefined];

    for (const invalidValue of invalid) {
      // Act
      const result = validateInputValue(
        name,
        input,
        def<boolean>(bool()),
        invalidValue
      );

      // Assert
      expect(result).toEqual(
        new Error(`${getBaseError(name, input)} is not of type 'boolean'`)
      );
    }
  });

  describe('Integers', () => {
    test('returns error for invalid int properties', () => {
      // Arrange
      const invalid = [new Date(), 'hello', true, [], {}, null, undefined];

      for (const invalidValue of invalid) {
        // Act
        const result = validateInputValue(
          name,
          input,
          def<number>(int()),
          invalidValue
        );

        // Assert
        expect(result).toEqual(
          new Error(`${getBaseError(name, input)} is not of type 'number'`)
        );
      }
    });

    test('returns error for floating int properties', () => {
      // Act
      const result = validateInputValue(name, input, def<number>(int()), 8.6);

      // Assert
      expect(result).toEqual(
        new Error(`${getBaseError(name, input)} is not an integer`)
      );
    });

    test('returns error for out of bounds int', () => {
      // Arrange
      const cases: [number, { min?: number; max?: number }, string][] = [
        [5, { min: 6 }, 'is smaller than a min value of 6'],
        [5, { max: 4 }, 'is larger than a max value of 4'],
        [5, { min: 1, max: 4 }, 'is larger than a max value of 4'],
      ];

      for (const [num, options, err] of cases) {
        // Act
        const result = validateInputValue(
          name,
          input,
          def<number>(constrain(int(), options)),
          num
        );

        // Assert
        expect(result).toEqual(
          new Error(`${getBaseError(name, input)} ${err}`)
        );
      }
    });

    test('returns value for in bounds int', () => {
      // Act
      const result = validateInputValue(
        name,
        input,
        def<number>(constrain(int(), { min: 8, max: 8 })),
        8
      );

      // Assert
      expect(result).toEqual(8);
    });
  });

  describe('Floats', () => {
    test('returns error for invalid float properties', () => {
      // Arrange
      const invalid = [new Date(), 'hello', true, [], {}, null, undefined];

      for (const invalidValue of invalid) {
        // Act
        const result = validateInputValue(
          name,
          input,
          def<number>(float()),
          invalidValue
        );

        // Assert
        expect(result).toEqual(
          new Error(`${getBaseError(name, input)} is not of type 'number'`)
        );
      }
    });

    test('returns value for floating int properties', () => {
      // Act
      const result = validateInputValue(name, input, def<number>(float()), 8.6);

      // Assert
      expect(result).toEqual(8.6);
    });

    test('returns error for out of bounds float', () => {
      // Arrange
      const cases: [number, { min?: number; max?: number }, string][] = [
        [5.1, { min: 5.2 }, 'is smaller than a min value of 5.2'],
        [5.1, { max: 4.9 }, 'is larger than a max value of 4.9'],
        [5.1, { min: 1, max: 4.9 }, 'is larger than a max value of 4.9'],
      ];

      for (const [num, options, err] of cases) {
        // Act
        const result = validateInputValue(
          name,
          input,
          def<number>(constrain(float(), options)),
          num
        );

        // Assert
        expect(result).toEqual(
          new Error(`${getBaseError(name, input)} ${err}`)
        );
      }
    });

    test('returns value for in bounds float', () => {
      // Act
      const result = validateInputValue(
        name,
        input,
        def<number>(constrain(float(), { min: 8.1, max: 8.1 })),
        8.1
      );

      // Assert
      expect(result).toEqual(8.1);
    });
  });

  describe('Strings', () => {
    test('returns error for invalid string properties', () => {
      // Arrange
      const invalid = [new Date(), 8, true, [], {}, null, undefined];

      for (const invalidValue of invalid) {
        // Act
        const result = validateInputValue(
          name,
          input,
          def<string>(str()),
          invalidValue
        );

        // Assert
        expect(result).toEqual(
          new Error(`${getBaseError(name, input)} is not of type 'string'`)
        );
      }
    });

    test('returns error for out of bounds string length', () => {
      // Arrange
      const cases: [
        string,
        { minLength?: number; maxLength?: number },
        string
      ][] = [
        ['hello', { minLength: 6 }, 'is smaller than a min value of 6'],
        ['helloo', { maxLength: 5 }, 'is larger than a max value of 5'],
        [
          'helloo',
          { minLength: 1, maxLength: 5 },
          'is larger than a max value of 5',
        ],
      ];

      for (const [string, options, err] of cases) {
        // Act
        const result = validateInputValue(
          name,
          input,
          def<string>(constrain(str(), options)),
          string
        );

        // Assert
        expect(result).toEqual(
          new Error(`${getBaseError(name, input)} ${err}`)
        );
      }
    });

    test('returns value for in bounds string length', () => {
      // Act
      const result = validateInputValue(
        name,
        input,
        def<string>(constrain(str(), { minLength: 5, maxLength: 5 })),
        'hello'
      );

      // Assert
      expect(result).toEqual('hello');
    });
  });

  describe('Dates', () => {
    test('returns error for invalid date properties', () => {
      // Arrange
      const invalid = ['hello', 8, true, [], {}, null, undefined];

      for (const invalidValue of invalid) {
        // Act
        const result = validateInputValue(
          name,
          input,
          def<Date>(date()),
          invalidValue
        );

        // Assert
        expect(result).toEqual(
          new Error(`${getBaseError(name, input)} is not of type 'Date'`)
        );
      }
    });

    test('returns error for out of bounds date/time', () => {
      // Arrange
      const cases: [Date, { minDate?: Date; maxDate?: Date }, string][] = [
        [
          new Date(2022, 5, 8),
          { minDate: new Date(2022, 5, 9) },
          'is smaller than a min value of 1654689600000',
        ],
        [
          new Date(2022, 5, 8),
          { maxDate: new Date(2022, 5, 7) },
          'is larger than a max value of 1654516800000',
        ],
        [
          new Date(2022, 5, 8),
          { minDate: new Date(2022, 5, 5), maxDate: new Date(2022, 5, 7) },
          'is larger than a max value of 1654516800000',
        ],
      ];

      for (const [string, options, err] of cases) {
        // Act
        const result = validateInputValue(
          name,
          input,
          def<Date>(constrain(date(), options)),
          string
        );

        // Assert
        expect(result).toEqual(
          new Error(`${getBaseError(name, input)} ${err}`)
        );
      }
    });

    test('returns value for in bounds date/time', () => {
      // Act
      const result = validateInputValue(
        name,
        input,
        def<Date>(
          constrain(date(), {
            minDate: new Date(2022, 5, 8),
            maxDate: new Date(2022, 5, 8),
          })
        ),
        new Date(2022, 5, 8)
      );

      // Assert
      expect(result).toEqual(new Date(2022, 5, 8));
    });
  });

  describe('Arrays', () => {
    test('returns error for invalid array properties', () => {
      // Arrange
      const invalid = ['hello', 8, true, new Date(), {}, null, undefined];

      for (const invalidValue of invalid) {
        // Act
        const result = validateInputValue(
          name,
          input,
          def<number[]>(array(int())),
          invalidValue
        );

        // Assert
        expect(result).toEqual(
          new Error(`${getBaseError(name, input)} is not of type 'Array'`)
        );
      }
    });

    test('returns error for out of bounds array length', () => {
      // Arrange
      const cases: [
        number[],
        { minItems?: number; maxItems?: number },
        string
      ][] = [
        [[1, 2, 3, 4, 5], { minItems: 6 }, 'is smaller than a min value of 6'],
        [[5, 4, 3, 2, 1], { maxItems: 4 }, 'is larger than a max value of 4'],
        [
          [5, 4, 3, 2, 1],
          { minItems: 3, maxItems: 4 },
          'is larger than a max value of 4',
        ],
      ];

      for (const [string, options, err] of cases) {
        // Act
        const result = validateInputValue(
          name,
          input,
          def<number[]>(constrain(array(int()), options)),
          string
        );

        // Assert
        expect(result).toEqual(
          new Error(`${getBaseError(name, input)} ${err}`)
        );
      }
    });

    test('returns value for in bounds array length', () => {
      // Act
      const result = validateInputValue(
        name,
        input,
        def<number[]>(
          constrain(array(int()), {
            minItems: 3,
            maxItems: 3,
          })
        ),
        [1, 6, 4]
      );

      // Assert
      expect(result).toEqual([1, 6, 4]);
    });

    test('returns error for incorrect array values', () => {
      // Act
      const result = validateInputValue(
        name,
        input,
        def<number[]>(array(int())),
        [1, 6, 4, 'not a number']
      );

      // Assert
      expect(result).toEqual(
        new Error(`${getBaseError(name, input)} is not of type 'number'`)
      );
    });
  });

  describe('Null', () => {
    test('returns error for invalid null properties', () => {
      // Arrange
      const invalid = [8, true, new Date(), {}, [], undefined];

      for (const invalidValue of invalid) {
        // Act
        const result = validateInputValue(
          name,
          input,
          def<string | null>(nullable(str())),
          invalidValue
        );

        // Assert
        expect(result).toEqual(
          new Error(`${getBaseError(name, input)} is not of type 'string'`)
        );
      }
    });
  });

  describe('Undefined', () => {
    test('returns error for invalid undefined properties', () => {
      // Arrange
      const invalid = [8, true, new Date(), {}, [], null];

      for (const invalidValue of invalid) {
        // Act
        const result = validateInputValue(
          name,
          input,
          def<string | undefined>(undefinable(str())),
          invalidValue
        );

        // Assert
        expect(result).toEqual(
          new Error(`${getBaseError(name, input)} is not of type 'string'`)
        );
      }
    });
  });

  describe('Complex values', () => {
    test('returns error for invalid complex properties', () => {
      // Arrange
      const invalid = ['hello', 8, true, new Date(), [], null, undefined];

      for (const invalidValue of invalid) {
        // Act
        const result = validateInputValue(
          name,
          input,
          def<{ text: string }>(complex<{ text: string }>({ text: str() })),
          invalidValue
        );

        // Assert
        expect(result).toEqual(
          new Error(`${getBaseError(name, input)} is not of type 'string'`)
        );
      }
    });

    test('returns error for incorrect complex values', () => {
      // Act
      const result = validateInputValue(
        name,
        input,
        def<{ text: string }>(complex<{ text: string }>({ text: str() })),
        { text: 8 }
      );

      // Assert
      expect(result).toEqual(
        new Error(`${getBaseError(name, input)} is not of type 'string'`)
      );
    });
  });

  describe('Custom validator', () => {
    test('returns error if value does not pass custom is valid constraint', () => {
      // Act
      const result = validateInputValue(
        name,
        input,
        def<string>(
          constrain(str(), { isValid: (value) => value === 'OnlyThisIsValid' })
        ),
        'NotValidValue'
      );

      // Assert
      expect(result).toEqual(
        new Error(
          `${getBaseError(name, input)} does not pass custom validation rules`
        )
      );
    });

    test('returns value if value passes custom is valid constraint', () => {
      // Act
      const result = validateInputValue(
        name,
        input,
        def<string>(
          constrain(str(), { isValid: (value) => value === 'OnlyThisIsValid' })
        ),
        'OnlyThisIsValid'
      );

      // Assert
      expect(result).toEqual('OnlyThisIsValid');
    });
  });

  describe('Runtime values', () => {
    test('returns runtime values at top level', () => {
      // Arrange
      const cases: PropertyType[] = [
        bool(),
        int(),
        float(),
        str(),
        date(),
        array(int()),
        complex<{ text: string }>({ text: str() }),
        nullable(str()),
        undefinable(str()),
      ];
      const runtimeValue = new RuntimeValue([], () => {});

      for (const type of cases) {
        // Act
        const result = validateInputValue(
          name,
          input,
          def(type as any),
          runtimeValue
        );

        // Assert
        expect(result).toEqual(runtimeValue);
      }
    });

    test('returns runtime values in arrays', () => {
      // Arrange
      const runtimeValue = new RuntimeValue([], () => {});

      // Act
      const result = validateInputValue(
        name,
        input,
        def<number[]>(array(int())),
        [runtimeValue]
      );

      // Assert
      expect(result).toEqual([runtimeValue]);
    });

    test('returns runtime values in complex objects', () => {
      // Arrange
      const runtimeValue = new RuntimeValue([], () => {});

      // Act
      const result = validateInputValue(
        name,
        input,
        def<{ text: string }>(complex<{ text: string }>({ text: str() })),
        { text: runtimeValue }
      );

      // Assert
      expect(result).toEqual({ text: runtimeValue });
    });
  });
});
