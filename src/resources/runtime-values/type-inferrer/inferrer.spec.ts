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
} from '../ast/expressions';
import { identifier } from '../ast/tokens/token';
import {
  anyType,
  array,
  complex,
  createUnion,
  ExprType,
  func,
  inferType,
  nullType,
  primative,
  PrimativeType,
  Type,
  undefinedType,
  unknownType,
} from './inferrer';

describe('Inferrer', () => {
  describe('Literals', () => {
    test('infers correct type for literals', () => {
      // Arrange
      const literals: [Literal, ExprType][] = [
        [new Literal(undefined), undefinedType],
        [new Literal(null), nullType],
        [new Literal(true), primative(Type.Boolean)],
        [new Literal(3), primative(Type.Number)],
        [new Literal('hello'), primative(Type.String)],
        [new Literal(new Date(2022, 1, 2)), primative(Type.Date)],
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
        [new Variable(identifier(varName)), primative(Type.String)],
        [new Variable(identifier(varName)), array(primative(Type.Boolean))],
        [
          new Variable(identifier(varName)),
          complex({ test: primative(Type.Boolean) }),
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
      const type = inferType(new Variable(identifier(varName)), {
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
      const objType = complex({ [propName]: propType });

      // Act
      const type = inferType(
        new GetProp(new Variable(identifier(objVar)), new Literal(propName)),
        { [objVar]: objType }
      );

      // Assert
      expect(type).toEqual(propType);
    });

    test('returns error if object does not have property', () => {
      // Arrange
      const propName = 'nonExistent';
      const objVar = 'obj';
      const objType = complex({ otherProp: array(primative(Type.Date)) });

      // Act
      const type = inferType(
        new GetProp(new Variable(identifier(objVar)), new Literal(propName)),
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
        new GetProp(new Variable(identifier(objVar)), new Literal(7)),
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
          new GetProp(new Variable(identifier(baseVar)), new Literal(7)),
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
          [new Literal('hello'), new Literal(7), new Literal(true)],
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
          [new Literal(''), new Literal(null)],
          primative(Type.Date),
        ],
      ];

      for (const [funcType, args, expected] of cases) {
        // Act
        const result = inferType(
          new Call(new Variable(identifier(funcVar)), args),
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
          new Call(new Variable(identifier(funcVar)), []),
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
        complex({ field: primative(Type.String) }),
        nullType,
        undefinedType,
      ];

      for (const invalidCallee of invalidCallees) {
        // Act
        const result = inferType(
          new Call(new Variable(identifier(funcVar)), []),
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
      const objectWithStringOrNullProp = complex({
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
          [new Literal('String')],
        ],
        [
          func([
            {
              parameters: [primative(Type.Number)],
              returnType: array(primative(Type.Boolean)),
            },
          ]),
          [new Literal('String')],
        ],
        [
          func([
            {
              parameters: [primative(Type.String)],
              returnType: primative(Type.Date),
            },
          ]),
          [
            new GetProp(
              new Variable(identifier(objectWithStringOrNullName)),
              new Literal('field')
            ),
          ],
        ],
      ];

      for (const [funcType, args] of cases) {
        // Act
        const result = inferType(
          new Call(new Variable(identifier(funcVar)), args),
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
        new Call(new Variable(identifier(funcVar)), [new Literal('string')]),
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
          parameters: [complex({ test: undefinedType })],
          returnType: array(primative(Type.Date)),
        },
        {
          parameters: [],
          returnType: primative(Type.Boolean),
        },
      ];

      // Act
      const result = inferType(new FunctionValue(() => '', signatures), {});

      // Assert
      expect(result).toEqual(func(signatures));
    });

    test('returns function type without signatures when not provided', () => {
      // Act
      const result = inferType(new FunctionValue(() => ''), {});

      // Assert
      expect(result).toEqual(func(undefined));
    });
  });

  describe('Format strings', () => {
    test('returns function type without signatures when not provided', () => {
      // Arrange
      // Act
      const result = inferType(new FormatString([], []), {});

      // Assert
      expect(result).toEqual(primative(Type.String));
    });
  });

  describe('Array constructor', () => {
    test('returns array of inner expression types', () => {
      // Arrange
      const cases: [Expr[], ExprType][] = [
        [[new Literal(''), new FormatString([], [])], primative(Type.String)],
        [[new Literal(1), new Literal(5.6)], primative(Type.Number)],
        [[new Literal(true), new Literal(false)], primative(Type.Boolean)],
        [[new Literal(undefined), new Literal(undefined)], undefinedType],
        [[new Literal(null), new Literal(null)], nullType],
        [
          [
            new ObjectConstructor([[identifier('test'), new Literal(8.1)]]),
            new ObjectConstructor([[identifier('test'), new Literal(2)]]),
          ],
          complex({ test: primative(Type.Number) }),
        ],
      ];

      for (const [expressions, expected] of cases) {
        // Act
        const result = inferType(new ArrayConstructor(expressions), {});

        // Assert
        expect(result).toEqual(array(expected));
      }
    });

    test('returns array of unified expression types when valid', () => {
      // Arrange
      const cases: [Expr[], ExprType][] = [
        [
          [new Literal(7), new Literal(undefined)],
          createUnion(undefinedType, primative(Type.Number)),
        ],
        [
          [new Literal(null), new Literal('hello')],
          createUnion(nullType, primative(Type.String)),
        ],
        [
          [new Literal(null), new Literal(undefined)],
          createUnion(undefinedType, nullType),
        ],
        [
          [
            new Literal(null),
            new Literal(new Date(2022, 1, 2)),
            new Literal(undefined),
          ],
          createUnion(
            nullType,
            createUnion(undefinedType, primative(Type.Date))
          ),
        ],
      ];

      for (const [expressions, expected] of cases) {
        // Act
        const result = inferType(new ArrayConstructor(expressions), {});

        // Assert
        expect(result).toEqual(array(expected));
      }
    });

    test('returns error when unifying invalid expression types', () => {
      // Arrange
      const cases: Expr[][] = [
        [new Literal(7), new Literal('hello')],
        [new Literal(true), new Literal('hello')],
        [new Literal(new Date(2022, 1, 1)), new Literal('string')],
        [new Literal(true), new ArrayConstructor([new Literal(true)])],
        [
          new ObjectConstructor([[identifier('test'), new Literal(9)]]),
          new Literal(3),
        ],
      ];

      for (const expressions of cases) {
        // Act
        const result = inferType(new ArrayConstructor(expressions), {});

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
        new ObjectConstructor([
          [identifier('string'), new Literal('hello')],
          [identifier('number'), new Literal(1)],
          [identifier('bool'), new Literal(true)],
          [identifier('date'), new Literal(new Date(2022, 1, 2))],
          [identifier('undefined'), new Literal(undefined)],
          [identifier('null'), new Literal(null)],
          [identifier('array'), new ArrayConstructor([new Literal(1)])],
          [
            identifier('nestedObject'),
            new ObjectConstructor([[identifier('number'), new Literal(1)]]),
          ],
          [identifier('variable'), new Variable(identifier(varName))],
        ]),
        { [varName]: varType }
      );

      // Assert
      expect(result).toEqual(
        complex({
          string: primative(Type.String),
          number: primative(Type.Number),
          bool: primative(Type.Boolean),
          date: primative(Type.Date),
          undefined: undefinedType,
          null: nullType,
          array: array(primative(Type.Number)),
          nestedObject: complex({ number: primative(Type.Number) }),
          variable: varType,
        })
      );
    });
  });
});
