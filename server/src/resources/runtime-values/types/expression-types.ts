import { Signature } from '../ast/expressions';
import { unifyExpressions } from './inferrer/inferrer';

export enum Type {
  Any = 'Any',
  Unknown = 'Unknown',
  Undefined = 'Undefined',
  Null = 'Null',
  Boolean = 'Boolean',
  Number = 'Number',
  String = 'String',
  Date = 'Date',
  Array = 'Array',
  Object = 'Object',
  Function = 'Function',
  Union = 'Union',
}

export type PrimativeType =
  | Type.Boolean
  | Type.Number
  | Type.String
  | Type.Date;

interface Any {
  type: Type.Any;
}
export const anyType: Any = {
  type: Type.Any,
};

interface Unknown {
  type: Type.Unknown;
}
export const unknownType: Unknown = {
  type: Type.Unknown,
};

interface Null {
  type: Type.Null;
}
export const nullType: Null = {
  type: Type.Null,
};
interface Undefined {
  type: Type.Undefined;
}
export const undefinedType: Undefined = {
  type: Type.Undefined,
};

interface Primative {
  type: PrimativeType;
}
export const primative = (type: PrimativeType): Primative => ({
  type,
});

interface Union {
  type: Type.Union;
  inner?: ExprType;
  undefined?: Undefined;
  null?: Null;
}

export const createUnion = (t1: ExprType, t2: ExprType): ExprType => {
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
    null: hasNull ? nullType : undefined,
    undefined: hasUndefined ? undefinedType : undefined,
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

interface Array {
  type: Type.Array;
  inner: ExprType;
}
export const array = (inner: ExprType): Array => ({
  type: Type.Array,
  inner,
});

interface Complex {
  type: Type.Object;
  fields: { [property: string]: ExprType };
}
export const complex = (fields: { [property: string]: ExprType }): Complex => ({
  type: Type.Object,
  fields,
});

interface Func {
  type: Type.Function;
  signatures?: Signature[];
}
export const func = (signatures: Signature[] | undefined): Func => ({
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
