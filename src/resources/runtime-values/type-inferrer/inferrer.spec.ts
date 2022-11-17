import { Call, Expr, GetProp, Literal, Variable } from '../ast/expressions';
import { identifier } from '../ast/tokens/token';
import {
  array,
  complex,
  createUnion,
  ExprType,
  func,
  inferType,
  nullType,
  primative,
  Type,
  undefinedType,
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
  });
});
