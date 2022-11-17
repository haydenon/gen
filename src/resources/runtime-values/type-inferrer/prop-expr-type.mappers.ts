import { PropertyType, Type as PType } from '../../properties/properties';
import {
  array,
  createUnion,
  ExprType,
  nullType,
  primative,
  Type as EType,
  undefinedType,
  complex,
} from './inferrer';

export const mapPropTypeToExprType = (propType: PropertyType): ExprType => {
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
      return createUnion(nullType, mapPropTypeToExprType(propType.inner));
    case PType.Undefinable:
      return createUnion(undefinedType, mapPropTypeToExprType(propType.inner));
    case PType.Array:
      return array(mapPropTypeToExprType(propType.inner));
    case PType.Complex:
      return complex(
        Object.keys(propType.fields).reduce((acc, field) => {
          acc[field] = mapPropTypeToExprType(propType.fields[field]);
          return acc;
        }, {} as { [field: string]: ExprType })
      );
  }
};
