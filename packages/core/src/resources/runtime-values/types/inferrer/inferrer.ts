import {
  FunctionValue as FunctionValue,
  ArrayConstructor,
  Call,
  GetProp,
  Literal,
  ObjectConstructor,
  Signature,
  Variable,
  Visitor,
  Expr,
  acceptExpr,
} from '../../ast/expressions';
import { outputExpression } from '../../outputer/outputer';
import {
  ExprType,
  anyType,
  unknownType,
  nullType,
  undefinedType,
  createUnion,
  Type,
  primative,
  func,
} from '../expression-types';

export const unifyExpressions = (t1: ExprType, t2: ExprType): ExprType => {
  if (t1 === anyType || t2 === anyType) {
    return anyType;
  }
  if (t1 === unknownType) {
    return t2;
  } else if (t2 === unknownType) {
    return t1;
  }

  const nullOrUndefined: ExprType[] = [nullType, undefinedType];

  if (nullOrUndefined.includes(t1) || nullOrUndefined.includes(t2)) {
    return t1.type === t2.type ? t1 : createUnion(t1, t2);
  }

  if (t1.type === Type.Function || t2.type === Type.Function) {
    if (
      t1.type !== Type.Function ||
      t2.type !== Type.Function ||
      // TODO: Better handling
      t1.signatures !== t2.signatures
    ) {
      throw new Error(
        'Cannot unify function with a different value or function with a sifferent signature'
      );
    }

    return t1;
  }

  if (t1.type === Type.Array || t2.type === Type.Array) {
    if (t1.type !== Type.Array || t2.type !== Type.Array) {
      throw new Error('Cannot unify array with a different value');
    }

    return {
      type: Type.Array,
      inner: unifyExpressions(t1.inner, t2.inner),
    };
  }

  if (t1.type === Type.Object || t2.type === Type.Object) {
    if (t1.type !== Type.Object || t2.type !== Type.Object) {
      throw new Error('Cannot unify object with a different value');
    }

    const t1Keys = Object.keys(t1.fields);
    if (
      t1Keys.length !== Object.keys(t2.fields).length ||
      t1Keys.some((t1key) => !t2.fields[t1key])
    ) {
      throw new Error('Cannot unify objects with different fields');
    }

    return {
      type: Type.Object,
      fields: t1Keys.reduce((acc, field) => {
        acc[field] = unifyExpressions(t1.fields[field], t2.fields[field]);
        return acc;
      }, {} as { [prop: string]: ExprType }),
    };
  }

  const primatives: Type[] = [
    Type.Boolean,
    Type.Number,
    Type.String,
    Type.Date,
  ];

  if (primatives.includes(t1.type) && primatives.includes(t2.type)) {
    if (t1.type !== t2.type) {
      throw new Error(`Cannot unify the types '${t1.type}' and '${t2.type}'`);
    }

    return t1;
  }

  // At least one must be a union
  return createUnion(t1, t2);
};

export const containsType = (actual: ExprType, expected: ExprType): boolean => {
  const getInnerTypes = (type: ExprType) => {
    if (type.type === Type.Union) {
      const types: ExprType[] = [];
      if (type.inner) {
        types.push(type.inner);
      }
      if (type.null) {
        types.push(nullType);
      }
      if (type.undefined) {
        types.push(undefinedType);
      }
      return types;
    }

    return [type];
  };

  // TODO: Verify this
  if (
    actual === anyType ||
    expected === anyType ||
    actual === unknownType ||
    expected === unknownType
  ) {
    return true;
  }

  if (actual.type === Type.Object || expected.type === Type.Object) {
    if (actual.type !== Type.Object || expected.type !== Type.Object) {
      return false;
    }

    return (
      expected.fields.length === actual.fields.length &&
      Object.keys(expected.fields).every((ef) =>
        Object.keys(actual.fields).some(
          (af) =>
            af === ef && containsType(actual.fields[af], expected.fields[ef])
        )
      )
    );
  }

  if (actual.type === Type.Array || expected.type === Type.Array) {
    if (actual.type !== Type.Array || expected.type !== Type.Array) {
      return false;
    }

    return containsType(actual.inner, expected.inner);
  }

  if (actual.type === Type.Function && expected.type === Type.Function) {
    throw new Error('Function types not supported as first class types yet');
  }

  const expectedTypes = getInnerTypes(expected);
  const actualTypes = getInnerTypes(actual);

  if (expectedTypes.length < actualTypes.length) {
    return false;
  }

  if (expectedTypes.length === 1) {
    return expectedTypes[0].type === actualTypes[0].type;
  }

  return actualTypes.every((at) =>
    expectedTypes.some((et) => containsType(at, et))
  );
};

const doesSignatureMatch = (
  signature: Signature,
  parameters: ExprType[]
): boolean =>
  signature.parameters.length === parameters.length &&
  signature.parameters.every((sp, i) => containsType(parameters[i], sp));

class TypeVisitor implements Visitor<ExprType> {
  constructor(public context: { [variable: string]: ExprType }) {}

  visitLiteralExpr(expr: Literal): ExprType {
    const value = expr.value;
    if (value === null) {
      return nullType;
    } else if (value === undefined) {
      return undefinedType;
    }

    switch (typeof value) {
      case 'boolean':
        return primative(Type.Boolean);
      case 'string':
        return primative(Type.String);
      case 'number':
        return primative(Type.Number);
      default:
        break;
    }

    if (value instanceof Date) {
      return primative(Type.Date);
    }

    // TODO: Array and objects?
    throw new Error('Invalid literal type.');
  }

  visitArrayConstructorExpr(expr: ArrayConstructor): ExprType {
    if (expr.items.length < 1) {
      return {
        type: Type.Array,
        inner: unknownType,
      };
    }

    const subType = expr.items.reduce(
      (acc, item) => unifyExpressions(acc, acceptExpr(this, item)),
      unknownType as ExprType
    );

    return {
      type: Type.Array,
      inner: subType,
    };
  }

  visitObjectConstructorExpr(expr: ObjectConstructor): ExprType {
    return {
      type: Type.Object,
      fields: expr.fields.reduce((acc, [field, fieldValue]) => {
        acc[field.lexeme] = acceptExpr(this, fieldValue);
        return acc;
      }, {} as { [field: string]: ExprType }),
    };
  }

  visitVariableExpr(expr: Variable): ExprType {
    const varName = expr.name.lexeme;
    if (!Object.prototype.hasOwnProperty.call(this.context, varName)) {
      throw new Error(`Undefined resource, function or variable '${varName}'.`);
    }

    return this.context[varName];
  }

  visitCallExpr(expr: Call): ExprType {
    const baseType = acceptExpr(this, expr.callee);
    if ([Type.Any, Type.Unknown].includes(baseType.type)) {
      return baseType;
    }

    if (baseType.type !== Type.Function) {
      throw new Error(`Cannot call value '${outputExpression(expr.callee)}'`);
    }

    const parameterTypes = expr.args.map((a) => acceptExpr(this, a));

    // Can't validate non typed functions
    if (!baseType.signatures) {
      return anyType;
    }

    const matchingSignature = baseType.signatures.find((s) =>
      doesSignatureMatch(s, parameterTypes)
    );
    if (!matchingSignature) {
      // TOOO: Better error message
      throw new Error(
        `No signature of '${outputExpression(
          expr.callee
        )}' matches the provided arguments`
      );
    }

    return matchingSignature.returnType;
  }

  visitGetExpr(expr: GetProp): ExprType {
    const baseType = acceptExpr(this, expr.obj);
    const indexerType = acceptExpr(this, expr.indexer);

    if ([Type.Any, Type.Unknown].includes(baseType.type)) {
      return baseType;
    }

    const unwrappedBase =
      baseType.type === Type.Union ? baseType.inner : baseType;
    if (
      unwrappedBase &&
      unwrappedBase.type === Type.Object &&
      [Type.String, Type.Number].includes(indexerType.type)
    ) {
      if (!Expr.isLiteral(expr.indexer)) {
        throw new Error(`Invalid object field access '${expr}'`);
      }
      const property = expr.indexer.value;
      if (
        !Object.prototype.hasOwnProperty.call(unwrappedBase.fields, property)
      ) {
        throw new Error(`Object does not have property '${property}'`);
      }

      return unwrappedBase.fields[property];
    } else if (
      unwrappedBase &&
      unwrappedBase.type === Type.Array &&
      indexerType.type === Type.Number
    ) {
      return unwrappedBase.inner;
    } else {
      throw new Error(`Invalid indexer used for '${outputExpression(expr)}'`);
    }
  }

  visitFormatString(): ExprType {
    return primative(Type.String);
  }

  visitFunctionExpr(expr: FunctionValue): ExprType {
    return func(expr.signatures);
  }
}

export function inferType(
  expression: Expr,
  context: { [name: string]: ExprType }
): ExprType | Error {
  try {
    const inferrer = new TypeVisitor(context);
    return acceptExpr(inferrer, expression);
  } catch (err) {
    return err as Error;
  }
}
