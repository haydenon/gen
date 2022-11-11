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
  PropertyDefinition,
  PropertyType,
  str,
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
  test('returns value for valid properties', () => {
    // Arrange
    const name = 'Test';
    const input = 'Input';
    const cases: [any, PropertyType][] = [
      [true, bool()],
      [new Date(), date()],
      ['hello', str()],
      [8, int()],
      [5.2, float()],
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

      //
      expect(result).toEqual(validValue);
    }
  });

  test('returns error for invalid bool properties', () => {
    // Arrange
    const name = 'Test';
    const input = 'Input';
    const invalid = [new Date(), 'hello', 1, [], {}];

    for (const invalidValue of invalid) {
      // Act
      const result = validateInputValue(
        name,
        input,
        def<boolean>(bool()),
        invalidValue
      );

      //
      expect(result).toEqual(
        new Error(`${getBaseError(name, input)} is not of type 'boolean'`)
      );
    }
  });

  describe('Integers', () => {
    test('returns error for invalid int properties', () => {
      // Arrange
      const name = 'Test';
      const input = 'Input';
      const invalid = [new Date(), 'hello', true, [], {}];

      for (const invalidValue of invalid) {
        // Act
        const result = validateInputValue(
          name,
          input,
          def<number>(int()),
          invalidValue
        );

        //
        expect(result).toEqual(
          new Error(`${getBaseError(name, input)} is not of type 'number'`)
        );
      }
    });

    test('returns error for floating int properties', () => {
      // Arrange
      const name = 'Test';
      const input = 'Bool';

      // Act
      const result = validateInputValue(name, input, def<number>(int()), 8.6);

      //
      expect(result).toEqual(
        new Error(`${getBaseError(name, input)} is not an integer`)
      );
    });

    test('returns error for out of bounds int', () => {
      // Arrange
      const name = 'Test';
      const input = 'Bool';
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

        //
        expect(result).toEqual(
          new Error(`${getBaseError(name, input)} ${err}`)
        );
      }
    });

    test('returns value for in bounds int', () => {
      // Arrange
      const name = 'Test';
      const input = 'Bool';
      // Act
      const result = validateInputValue(
        name,
        input,
        def<number>(constrain(int(), { min: 8, max: 8 })),
        8
      );

      //
      expect(result).toEqual(8);
    });
  });

  describe('Floats', () => {
    test('returns error for invalid float properties', () => {
      // Arrange
      const name = 'Test';
      const input = 'Input';
      const invalid = [new Date(), 'hello', true, [], {}];

      for (const invalidValue of invalid) {
        // Act
        const result = validateInputValue(
          name,
          input,
          def<number>(float()),
          invalidValue
        );

        //
        expect(result).toEqual(
          new Error(`${getBaseError(name, input)} is not of type 'number'`)
        );
      }
    });

    test('returns value for floating int properties', () => {
      // Arrange
      const name = 'Test';
      const input = 'Bool';

      // Act
      const result = validateInputValue(name, input, def<number>(float()), 8.6);

      //
      expect(result).toEqual(8.6);
    });

    test('returns error for out of bounds float', () => {
      // Arrange
      const name = 'Test';
      const input = 'Bool';
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

        //
        expect(result).toEqual(
          new Error(`${getBaseError(name, input)} ${err}`)
        );
      }
    });

    test('returns value for in bounds float', () => {
      // Arrange
      const name = 'Test';
      const input = 'Bool';
      // Act
      const result = validateInputValue(
        name,
        input,
        def<number>(constrain(float(), { min: 8.1, max: 8.1 })),
        8.1
      );

      //
      expect(result).toEqual(8.1);
    });
  });

  test('returns runtime values', () => {
    // TODO
  });
});

//   visitIntValue = (type: IntType, value: any) => {
//     if (Math.abs(value) % 1 !== 0) {
//       throw new Error(`${this.baseError} is not an integer`);
//     }
//     return this.checkValue(type, value, 'number', (num) => num);
//   };
//   visitFloatValue = (type: FloatType, value: any) => {
//     return this.checkValue(type, value, 'number', (num) => num);
//   };
//   visitStrValue = (type: StringType, value: any) => {
//     return this.checkValue(type, value, 'string', (str) => str.length);
//   };
//   visitDateValue = (type: DateType, value: any) => {
//     return this.checkValue(type, value, Date, (date) => date.getTime());
//   };

//   checkArrayValue = (type: ArrayType, value: any): [false] => {
//     this.checkValue(type, value, Array, (arr) => arr.length);
//     return [false];
//   };
//   mapArrayValue = (_: ArrayType, value: any[]): any => value;

//   mapNullValue = () => null;
//   mapUndefinedValue = () => undefined;

//   checkComplexValue = (): [false] => [false];
//   mapComplexValue = (_: ComplexType, value: { [key: string]: any }) => value;
