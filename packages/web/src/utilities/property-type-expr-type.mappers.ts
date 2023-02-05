import {
  ExprType,
  Type as PType,
  complexObject,
  expressionTypeHelpers,
} from '@haydenon/gen-core';

import { PropertyTypeResponse } from '@haydenon/gen-server';

const {
  array,
  createUnion,
  nullType,
  primative,
  undefinedType,
  Type: EType,
} = expressionTypeHelpers;

export const mapPropTypeRespToExprType = (
  propType: PropertyTypeResponse
): ExprType => {
  switch (propType.type) {
    case PType.Boolean:
      return primative(EType.Boolean);
    case PType.Int:
    case PType.Float:
      return primative(EType.Number);
    case PType.String:
      return primative(EType.String);
    case PType.Date:
      return primative(EType.Date);
    case PType.Nullable:
      return createUnion(nullType, mapPropTypeRespToExprType(propType.inner));
    case PType.Undefinable:
      return createUnion(
        undefinedType,
        mapPropTypeRespToExprType(propType.inner)
      );
    case PType.Array:
      return array(mapPropTypeRespToExprType(propType.inner));
    case PType.Link:
      return mapPropTypeRespToExprType(propType.inner);
    case PType.Complex:
      return complexObject(
        Object.keys(propType.fields).reduce((acc, field) => {
          acc[field] = mapPropTypeRespToExprType(propType.fields[field]);
          return acc;
        }, {} as { [field: string]: ExprType })
      );
  }
};
