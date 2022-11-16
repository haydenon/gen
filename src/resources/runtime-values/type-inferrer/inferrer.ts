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
} from '../ast/expressions';
import { outputExpression } from '../outputer/outputer';

enum Type {
  Any,
  Unknown,
  Undefined,
  Null,
  Boolean,
  Number,
  String,
  Date,
  Array,
  Object,
  Function,
  Union,
}

type PrimativeType = Type.Boolean | Type.Number | Type.String | Type.Date;

interface Any {
  type: Type.Any;
}
const anyType: Any = {
  type: Type.Any,
};

interface Unknown {
  type: Type.Unknown;
}
const unknownType: Unknown = {
  type: Type.Unknown,
};

interface Null {
  type: Type.Null;
}
const nullType: Null = {
  type: Type.Null,
};
interface Undefined {
  type: Type.Undefined;
}
const undefinedType: Undefined = {
  type: Type.Undefined,
};

interface Primative {
  type: PrimativeType;
}
const primative = (type: PrimativeType): Primative => ({
  type,
});

interface Union {
  type: Type.Union;
  inner?: ExprType;
  undefined?: Type.Undefined;
  null?: Type.Null;
}

// | Null
// | Undefined
// | Primative
// | Union

const createUnion = (t1: ExprType, t2: ExprType): ExprType => {
  let types: ExprType[] = [];
  if (t1.type === Type.Union) {
    types = [
      ...types,
      ...([t1.inner, t1.null, t1.undefined].filter((t) => !!t) as ExprType[]),
    ];
  } else {
    types.push(t1);
  }
  if (t2.type === Type.Union) {
    types = [
      ...types,
      ...([t2.inner, t2.null, t2.undefined].filter((t) => !!t) as ExprType[]),
    ];
  } else {
    types.push(t2);
  }

  const nullTypes: ExprType[] = [undefinedType, nullType];
  const hasNull = types.includes(nullType);
  const hasUndefined = types.includes(undefinedType);
  const baseUnion: Partial<Union> = {
    null: hasNull ? Type.Null : undefined,
    undefined: hasUndefined ? Type.Undefined : undefined,
  };
  const nonNullTypes = types.filter((t) => !nullTypes.includes(t));
  if (nonNullTypes.length === 1) {
    return hasNull || hasUndefined
      ? {
          type: Type.Union,
          inner: nonNullTypes[0],
          ...baseUnion,
        }
      : nonNullTypes[0];
  } else if (nonNullTypes.length === 0) {
    return {
      type: Type.Union,
      ...baseUnion,
    };
  } else {
    return {
      type: Type.Union,
      inner: unifyExpressions(nonNullTypes[0], nonNullTypes[1]),
      ...baseUnion,
    };
  }
};

const unifyExpressions = (t1: ExprType, t2: ExprType): ExprType => {
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
    return createUnion(t1, t2);
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

interface Array {
  type: Type.Array;
  inner: ExprType;
}

interface Complex {
  type: Type.Object;
  fields: { [property: string]: ExprType };
}

interface Func {
  type: Type.Function;
  signatures?: Signature[];
}
const func = (signatures: Signature[] | undefined): Func => ({
  type: Type.Function,
  signatures,
});

export type ExprType =
  | Any
  | Unknown
  | Null
  | Undefined
  | Primative
  | Union
  | Array
  | Complex
  | Func;

const containsType = (actual: ExprType, expected: ExprType): boolean => {
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
  signature.parameters.length !== parameters.length &&
  signature.parameters.every((sp, i) => containsType(parameters[i], sp));

class TypeVisitor implements Visitor<ExprType> {
  constructor(public context: { [variable: string]: ExprType }) {}

  visitLiteralExpr(expr: Literal): ExprType {
    const value = expr.value;
    if (value === null) {
      return nullType;
    } else if (value) {
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
      (acc, item) => unifyExpressions(acc, item.accept(this)),
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
        acc[field.lexeme] = fieldValue.accept(this);
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
    const baseType = expr.callee.accept(this);
    if (baseType.type !== Type.Function) {
      throw new Error(`Cannot call value '${outputExpression(expr.callee)}'`);
    }

    const parameterTypes = expr.args.map((a) => a.accept(this));

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
    const baseType = expr.obj.accept(this);
    const indexerType = expr.indexer.accept(this);

    if (
      baseType.type === Type.Object &&
      // indexerType.type !== undefined &&
      [Type.String, Type.Number].includes(indexerType.type)
    ) {
      if (!(expr.indexer instanceof Literal)) {
        throw new Error(`Invalid object field access '${expr}'`);
      }
      const property = expr.indexer.value;
      if (!Object.prototype.hasOwnProperty.call(baseType.fields, property)) {
        throw new Error();
      }

      return baseType.fields[property];
    } else if (
      baseType.type === Type.Array &&
      indexerType.type === Type.Number
    ) {
      return baseType.inner;
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
