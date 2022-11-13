import { RuntimeValue } from '../../resources/runtime-values';
import {
  FormatString,
  Literal,
} from '../../resources/runtime-values/ast/expressions';
import { replaceRuntimeValueTemplates } from './runtime-value.mapper';

const validParserRuntimeValue = new RuntimeValue([], new Literal(1));

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
      'hello ${test} my name is ${another}',
      ['hello ', ' my name is ', ''],
      ['test', 'another'],
    ],
  ];
  extraValuesIntoFormatStringCases.forEach(
    ([str, formatStrings, expressionStrings]) =>
      test('parses any expression strings with extra values into a format string', () => {
        // Arrange
        const validParser = jest.fn().mockReturnValue(validParserRuntimeValue);

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
        expect(formatString.strings.map((l) => l.value)).toEqual(formatStrings);

        expressionStrings.forEach((exprString, i) =>
          expect(validParser).toHaveBeenNthCalledWith(i + 1, exprString)
        );
      })
  );
});
