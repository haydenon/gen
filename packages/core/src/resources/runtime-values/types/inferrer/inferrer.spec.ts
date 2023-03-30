import {
  ArrayConstructor,
  Call,
  Expr,
  FormatString,
  FunctionValue,
  GetProp,
  Literal,
  ObjectConstructor,
  Signature,
  Variable,
} from '../../ast/expressions';
import { identifier } from '../../ast/tokens/token';
import {
  ExprType,
  undefinedType,
  nullType,
  primative,
  Type,
  array,
  complexObject,
  func,
  createUnion,
  anyType,
  unknownType,
  PrimativeType,
} from '../expression-types';
import { inferType } from './inferrer';

describe('Inferrer', () => {
  describe('Literals', () => {
    test('infers correct type for literals', () => {
      // Arrange
      const literals: [Literal, ExprType][] = [
        [Expr.Literal(undefined), undefinedType],
        [Expr.Literal(null), nullType],
        [Expr.Literal(true), primative(Type.Boolean)],
        [Expr.Literal(3), primative(Type.Number)],
        [Expr.Literal('hello'), primative(Type.String)],
        [Expr.Literal(new Date(2022, 1, 2)), primative(Type.Date)],
      ];

      for (const [literal, expected] of literals) {
        // Act
        const type = inferType(literal, {});

        // Assert
        expect(type).toEqual(expected);
      }
    });
  });

  describe('Variables', () => {
    test('infers correct type for variables', () => {
      // Arrange
      const varName = 'test';
      const variables: [Variable, ExprType][] = [
        [Expr.Variable(identifier(varName)), primative(Type.String)],
        [Expr.Variable(identifier(varName)), array(primative(Type.Boolean))],
        [
          Expr.Variable(identifier(varName)),
          complexObject({ test: primative(Type.Boolean) }),
        ],
      ];

      for (const [variable, varType] of variables) {
        // Act
        const type = inferType(variable, { [varName]: varType });

        // Assert
        expect(type).toEqual(varType);
      }
    });

    test('throws error when variable does not exist', () => {
      // Arrange
      const varName = 'nonExistent';

      // Act
      const type = inferType(Expr.Variable(identifier(varName)), {
        test: primative(Type.String),
      });

      // Assert
      expect(type).toBeInstanceOf(Error);
    });
  });

  describe('Get Property', () => {
    test('infers correct type for object property access', () => {
      // Arrange
      const propName = 'prop';
      const propType = array(primative(Type.Date));
      const objVar = 'obj';
      const objType = complexObject({ [propName]: propType });

      // Act
      const type = inferType(
        Expr.GetProp(Expr.Variable(identifier(objVar)), Expr.Literal(propName)),
        { [objVar]: objType }
      );

      // Assert
      expect(type).toEqual(propType);
    });

    test('returns error if object does not have property', () => {
      // Arrange
      const propName = 'nonExistent';
      const objVar = 'obj';
      const objType = complexObject({ otherProp: array(primative(Type.Date)) });

      // Act
      const type = inferType(
        Expr.GetProp(Expr.Variable(identifier(objVar)), Expr.Literal(propName)),
        { [objVar]: objType }
      );

      // Assert
      expect(type).toBeInstanceOf(Error);
    });

    test('infers correct type for array index access', () => {
      // Arrange
      const innerType = primative(Type.Date);
      const objVar = 'obj';
      const objType = array(innerType);

      // Act
      const type = inferType(
        Expr.GetProp(Expr.Variable(identifier(objVar)), Expr.Literal(7)),
        { [objVar]: objType }
      );

      // Assert
      expect(type).toEqual(innerType);
    });

    test('errors if value is not array or object', () => {
      // Arrange
      const invalidTypes = [primative(Type.Date), undefinedType, nullType];
      const baseVar = 'obj';

      for (const invalidType of invalidTypes) {
        // Act
        const type = inferType(
          Expr.GetProp(Expr.Variable(identifier(baseVar)), Expr.Literal(7)),
          { [baseVar]: invalidType }
        );

        // Assert
        expect(type).toBeInstanceOf(Error);
      }
    });
  });

  describe('Calls', () => {
    // const func = () =>;
    test('returns function return type with matching signature', () => {
      // Arrange
      const funcVar = 'func';
      const cases: [ExprType, Expr[], ExprType][] = [
        [
          func([
            {
              parameters: [
                primative(Type.String),
                primative(Type.Number),
                primative(Type.Boolean),
              ],
              returnType: primative(Type.String),
            },
          ]),
          [Expr.Literal('hello'), Expr.Literal(7), Expr.Literal(true)],
          primative(Type.String),
        ],
        [
          func([
            {
              parameters: [],
              returnType: array(primative(Type.Boolean)),
            },
          ]),
          [],
          array(primative(Type.Boolean)),
        ],
        [
          func([
            {
              parameters: [
                createUnion(undefinedType, primative(Type.String)),
                createUnion(nullType, array(primative(Type.Number))),
              ],
              returnType: primative(Type.Date),
            },
          ]),
          [Expr.Literal(''), Expr.Literal(null)],
          primative(Type.Date),
        ],
      ];

      for (const [funcType, args, expected] of cases) {
        // Act
        const result = inferType(
          Expr.Call(Expr.Variable(identifier(funcVar)), args),
          { [funcVar]: funcType }
        );

        // Assert
        expect(result).toEqual(expected);
      }
    });

    test('returns any/unknown if callee is any/unknown', () => {
      // Arrange
      const funcVar = 'func';
      const anyOrUnknown: ExprType[] = [anyType, unknownType];

      for (const callee of anyOrUnknown) {
        // Act
        const result = inferType(
          Expr.Call(Expr.Variable(identifier(funcVar)), []),
          { [funcVar]: callee }
        );

        // Assert
        expect(result).toEqual(callee);
      }
    });

    test('returns error if callee is not a function', () => {
      // Arrange
      const funcVar = 'func';
      const invalidCallees: ExprType[] = [
        ...(
          [Type.Boolean, Type.Number, Type.String, Type.Date] as PrimativeType[]
        ).map((t) => primative(t)),
        array(primative(Type.Boolean)),
        complexObject({ field: primative(Type.String) }),
        nullType,
        undefinedType,
      ];

      for (const invalidCallee of invalidCallees) {
        // Act
        const result = inferType(
          Expr.Call(Expr.Variable(identifier(funcVar)), []),
          { [funcVar]: invalidCallee }
        );

        // Assert
        expect(result).toBeInstanceOf(Error);
      }
    });

    test('returns error if no signature matches', () => {
      // Arrange
      const funcVar = 'func';
      const objectWithStringOrNullName = 'stringOrUndefinedObj';
      const objectWithStringOrNullProp = complexObject({
        field: createUnion(undefinedType, primative(Type.String)),
      });

      const cases: [ExprType, Expr[]][] = [
        [
          func([
            {
              parameters: [primative(Type.String)],
              returnType: primative(Type.String),
            },
          ]),
          [],
        ],
        [
          func([
            {
              parameters: [],
              returnType: array(primative(Type.Boolean)),
            },
          ]),
          [Expr.Literal('String')],
        ],
        [
          func([
            {
              parameters: [primative(Type.Number)],
              returnType: array(primative(Type.Boolean)),
            },
          ]),
          [Expr.Literal('String')],
        ],
        [
          func([
            {
              parameters: [primative(Type.String)],
              returnType: primative(Type.Date),
            },
          ]),
          [
            Expr.GetProp(
              Expr.Variable(identifier(objectWithStringOrNullName)),
              Expr.Literal('field')
            ),
          ],
        ],
      ];

      for (const [funcType, args] of cases) {
        // Act
        const result = inferType(
          Expr.Call(Expr.Variable(identifier(funcVar)), args),
          {
            [funcVar]: funcType,
            [objectWithStringOrNullName]: objectWithStringOrNullProp,
          }
        );

        // Assert
        expect(result).toBeInstanceOf(Error);
      }
    });

    test('returns any type if function has no signature metadata', () => {
      // Arrange
      const funcVar = 'func';

      // Act
      const result = inferType(
        Expr.Call(Expr.Variable(identifier(funcVar)), [Expr.Literal('string')]),
        { [funcVar]: func(undefined) }
      );

      // Assert
      expect(result).toEqual(anyType);
    });
  });

  describe('Functions', () => {
    test('returns function type with signatures when provided', () => {
      // Arrange
      const signatures: Signature[] = [
        {
          parameters: [complexObject({ test: undefinedType })],
          returnType: array(primative(Type.Date)),
        },
        {
          parameters: [],
          returnType: primative(Type.Boolean),
        },
      ];

      // Act
      const result = inferType(
        Expr.FunctionValue(() => '', signatures),
        {}
      );

      // Assert
      expect(result).toEqual(func(signatures));
    });

    test('returns function type without signatures when not provided', () => {
      // Act
      const result = inferType(
        Expr.FunctionValue(() => ''),
        {}
      );

      // Assert
      expect(result).toEqual(func(undefined));
    });
  });

  describe('Format strings', () => {
    test('returns function type without signatures when not provided', () => {
      // Arrange
      // Act
      const result = inferType(Expr.FormatString([], []), {});

      // Assert
      expect(result).toEqual(primative(Type.String));
    });
  });

  describe('Array constructor', () => {
    test('returns array of inner expression types', () => {
      // Arrange
      const cases: [Expr[], ExprType][] = [
        [[Expr.Literal(''), Expr.FormatString([], [])], primative(Type.String)],
        [[Expr.Literal(1), Expr.Literal(5.6)], primative(Type.Number)],
        [[Expr.Literal(true), Expr.Literal(false)], primative(Type.Boolean)],
        [[Expr.Literal(undefined), Expr.Literal(undefined)], undefinedType],
        [[Expr.Literal(null), Expr.Literal(null)], nullType],
        [
          [
            Expr.ObjectConstructor([[identifier('test'), Expr.Literal(8.1)]]),
            Expr.ObjectConstructor([[identifier('test'), Expr.Literal(2)]]),
          ],
          complexObject({ test: primative(Type.Number) }),
        ],
      ];

      for (const [expressions, expected] of cases) {
        // Act
        const result = inferType(Expr.ArrayConstructor(expressions), {});

        // Assert
        expect(result).toEqual(array(expected));
      }
    });

    test('returns array of unified expression types when valid', () => {
      // Arrange
      const cases: [Expr[], ExprType][] = [
        [
          [Expr.Literal(7), Expr.Literal(undefined)],
          createUnion(undefinedType, primative(Type.Number)),
        ],
        [
          [Expr.Literal(null), Expr.Literal('hello')],
          createUnion(nullType, primative(Type.String)),
        ],
        [
          [Expr.Literal(null), Expr.Literal(undefined)],
          createUnion(undefinedType, nullType),
        ],
        [
          [
            Expr.Literal(null),
            Expr.Literal(new Date(2022, 1, 2)),
            Expr.Literal(undefined),
          ],
          createUnion(
            nullType,
            createUnion(undefinedType, primative(Type.Date))
          ),
        ],
      ];

      for (const [expressions, expected] of cases) {
        // Act
        const result = inferType(Expr.ArrayConstructor(expressions), {});

        // Assert
        expect(result).toEqual(array(expected));
      }
    });

    test('returns error when unifying invalid expression types', () => {
      // Arrange
      const cases: Expr[][] = [
        [Expr.Literal(7), Expr.Literal('hello')],
        [Expr.Literal(true), Expr.Literal('hello')],
        [Expr.Literal(new Date(2022, 1, 1)), Expr.Literal('string')],
        [Expr.Literal(true), Expr.ArrayConstructor([Expr.Literal(true)])],
        [
          Expr.ObjectConstructor([[identifier('test'), Expr.Literal(9)]]),
          Expr.Literal(3),
        ],
      ];

      for (const expressions of cases) {
        // Act
        const result = inferType(Expr.ArrayConstructor(expressions), {});

        // Assert
        expect(result).toBeInstanceOf(Error);
      }
    });
  });

  describe('Object constructor', () => {
    test('returns object type with correct field types', () => {
      // Arrange
      const varName = 'test';
      const varType = array(primative(Type.Boolean));

      // Act
      const result = inferType(
        Expr.ObjectConstructor([
          [identifier('string'), Expr.Literal('hello')],
          [identifier('number'), Expr.Literal(1)],
          [identifier('bool'), Expr.Literal(true)],
          [identifier('date'), Expr.Literal(new Date(2022, 1, 2))],
          [identifier('undefined'), Expr.Literal(undefined)],
          [identifier('null'), Expr.Literal(null)],
          [identifier('array'), Expr.ArrayConstructor([Expr.Literal(1)])],
          [
            identifier('nestedObject'),
            Expr.ObjectConstructor([[identifier('number'), Expr.Literal(1)]]),
          ],
          [identifier('variable'), Expr.Variable(identifier(varName))],
        ]),
        { [varName]: varType }
      );

      // Assert
      expect(result).toEqual(
        complexObject({
          string: primative(Type.String),
          number: primative(Type.Number),
          bool: primative(Type.Boolean),
          date: primative(Type.Date),
          undefined: undefinedType,
          null: nullType,
          array: array(primative(Type.Number)),
          nestedObject: complexObject({ number: primative(Type.Number) }),
          variable: varType,
        })
      );
    });
  });
});
