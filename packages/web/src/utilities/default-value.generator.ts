import { Type } from '@haydenon/gen-core';
import { PropertyTypeResponse } from '@haydenon/gen-server';
import { WELL_KNOWN_RUNTIME_VALUES } from '../areas/resources/runtime-value';

export const generateDefaultValue = (
  propertyType: PropertyTypeResponse
): any => {
  switch (propertyType.type) {
    case Type.String:
      return '';
    case Type.Boolean:
      return false;
    case Type.Float:
      return 0;
    case Type.Int:
      return 0;
    case Type.Date:
      return WELL_KNOWN_RUNTIME_VALUES.minDate;
    case Type.Link:
      return generateDefaultValue(propertyType.inner);
    case Type.Nullable:
      return null;
    case Type.Undefinable:
      return WELL_KNOWN_RUNTIME_VALUES.undefined;
    case Type.Array:
      return [];
    case Type.Complex:
      return Object.keys(propertyType.fields).reduce((obj, field) => {
        obj[field] = generateDefaultValue(propertyType.fields[field]);
        return obj;
      }, {} as { [field: string]: any });
  }
};
