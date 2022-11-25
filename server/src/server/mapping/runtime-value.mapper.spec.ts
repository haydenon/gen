import { RuntimeValue } from '../../resources/runtime-values';
import {
  FormatString,
  Literal,
} from '../../resources/runtime-values/ast/expressions';
import { replaceRuntimeValueTemplates } from './runtime-value.mapper';

const validParserExpr = new Literal(1);
const validParserRuntimeValue = new RuntimeValue([], validParserExpr);
let validParser: (value: string) => RuntimeValue<any> | Error;

beforeEach(() => {
  validParser = jest.fn().mockReturnValue(validParserRuntimeValue);
});

describe('Mapping expression strings', () => {
  test('parses just an expression if the string only contains it', () => {
    // Arrange
    const validParser = jest.fn().mockReturnValue(validParserRuntimeValue);

    // Act
    const [result, errors] = replaceRuntimeValueTemplates(
      '${test}',
      validParser
    );

    // Assert
    expect(errors).toHaveLength(0);
    expect(result).toBe(validParserRuntimeValue);
    expect(validParser).toHaveBeenCalledWith('test');
  });

  const extraValuesIntoFormatStringCases: [string, string[], string[]][] = [
    [' ${test}', [' ', ''], ['test']],
    [' ${test} ', [' ', ' '], ['test']],
    ['${test} ', ['', ' '], ['test']],
    [
      'hello ${test} my name is ${another expression}',
      ['hello ', ' my name is ', ''],
      ['test', 'another expression'],
    ],
  ];
  extraValuesIntoFormatStringCases.forEach(
    ([str, formatStrings, expressionStrings]) =>
      test('parses any expression strings with extra values into a format string', () => {
        // Arrange

        // Act
        const [result, errors] = replaceRuntimeValueTemplates(
          str,
          validParser
        ) as [RuntimeValue<any>, Error[]];

        // Assert
        expect(errors).toHaveLength(0);
        expect(result).toBeInstanceOf(RuntimeValue);
        expect(result.expression).toBeInstanceOf(FormatString);
        const formatString = result.expression as FormatString;
        expect(formatString.strings.map((s) => s.value)).toEqual(formatStrings);

        expressionStrings.forEach((exprString, i) =>
          expect(validParser).toHaveBeenNthCalledWith(i + 1, exprString)
        );
      })
  );

  test('returns a string with no expressions', () => {
    // Arrange
    const input = 'not an expression $1';

    // Act
    const [result, errors] = replaceRuntimeValueTemplates(
      input,
      validParser
    ) as [RuntimeValue<any>, Error[]];

    // Assert
    expect(result).toBe(input);
    expect(errors).toHaveLength(0);
  });

  test('escapes double dollar signs in front of expression open for string without expression', () => {
    // Act
    const [result, errors] = replaceRuntimeValueTemplates(
      '$${hello world}',
      validParser
    ) as [RuntimeValue<any>, Error[]];

    // Assert
    expect(result).toEqual('${hello world}');
    expect(errors).toHaveLength(0);
  });

  test('escapes double dollar signs in front of expression open for string with expression', () => {
    // Act
    const [result, errors] = replaceRuntimeValueTemplates(
      'This is $${not an expression}, but ${this is}',
      validParser
    ) as [RuntimeValue<any>, Error[]];

    // Assert
    expect(result).toBeInstanceOf(RuntimeValue);
    const runtimeVal = result as RuntimeValue<any>;
    expect(runtimeVal.depdendentStateNames).toEqual([]);
    expect(runtimeVal.expression).toBeInstanceOf(FormatString);
    const formatString = runtimeVal.expression as FormatString;
    expect(formatString.strings.map((s) => s.value)).toEqual([
      'This is ${not an expression}, but ',
      '',
    ]);
    expect(formatString.expressions.map((e) => (e as Literal).value)).toEqual([
      1,
    ]);

    expect(errors).toHaveLength(0);
  });

  test('merges depdendent state requirements when creating a format string', () => {
    // Arrange
    const firstLiteral = new Literal(1);
    const secondLiteral = new Literal(2);
    const firstRuntimeValue = new RuntimeValue(['first'], firstLiteral);
    const secondRuntimeValue = new RuntimeValue(['second'], secondLiteral);
    validParser = jest
      .fn()
      .mockReturnValueOnce(firstRuntimeValue)
      .mockReturnValueOnce(secondRuntimeValue);

    // Act
    const [result, errors] = replaceRuntimeValueTemplates(
      '${first} ${second}',
      validParser
    ) as [RuntimeValue<any>, Error[]];

    // Assert
    expect(result).toBeInstanceOf(RuntimeValue);
    const runtimeVal = result as RuntimeValue<any>;
    expect(runtimeVal.depdendentStateNames).toEqual(['first', 'second']);
    expect(runtimeVal.expression).toBeInstanceOf(FormatString);
    const formatString = runtimeVal.expression as FormatString;
    expect(formatString.strings.map((s) => s.value)).toEqual(['', ' ', '']);
    expect(formatString.expressions).toEqual([firstLiteral, secondLiteral]);

    expect(errors).toHaveLength(0);
  });

  test('returns an error when value has nested expressions', () => {
    // Act
    const [, errors] = replaceRuntimeValueTemplates(
      '${${nested}}',
      validParser
    );

    // Assert
    expect(errors).toHaveLength(1);
  });

  test('returns an error when value has unclosed expressions', () => {
    // Act
    const [, errors] = replaceRuntimeValueTemplates(
      '${oh no I forgot to close the expression',
      validParser
    );

    // Assert
    expect(errors).toHaveLength(1);
  });
});

describe('Mapping expression complex values', () => {
  const normalCases: [any, string][] = [
    [{ hello: 'world' }, 'objects'],
    [[1, 'hello', true], 'arrays'],
    [new Date(2022, 1, 1), 'dates'],
    ['look ma, no expressions', 'strings'],
    [42, 'numbers'],
    [true, 'booleans'],
  ];
  normalCases.forEach(([value, description]) =>
    test(`replaces with equivalent value for ${description} with no runtime value expressions`, () => {
      // Act
      const [result, errors] = replaceRuntimeValueTemplates(value, validParser);

      // Assert
      expect(result).toEqual(value);
      expect(errors).toHaveLength(0);
    })
  );

  test('replaces expression strings in nested objects', () => {
    // Arrange
    const object = { field: { another: { hello: '${expression}' } }, age: 38 };

    // Act
    const [result, errors] = replaceRuntimeValueTemplates(object, validParser);

    // Assert
    expect(result).toEqual({
      ...object,
      field: { ...object.field, another: { hello: validParserRuntimeValue } },
    });
    expect(errors).toHaveLength(0);
  });

  test('replaces expression strings in nested objects', () => {
    // Arrange
    const array = [12, 3, ['${expression}']];

    // Act
    const [result, errors] = replaceRuntimeValueTemplates(array, validParser);

    // Assert
    expect(result).toEqual([12, 3, [validParserRuntimeValue]]);
    expect(errors).toHaveLength(0);
  });
});
