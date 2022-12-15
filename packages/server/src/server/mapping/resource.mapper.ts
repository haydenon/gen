import {
  Constraint,
  PropertyDefinition,
  PropertyMap,
  PropertyType,
  Resource,
  Type,
} from '@haydenon/gen-core';
import { ResourceOrGroupItem } from '@haydenon/gen-core/resources/resource';
import {
  ResourceResponse,
  PropertyMapResponse,
  PropertyDefinitionResponse,
} from '../models';
import {
  ConstraintResponse,
  PropertyTypeResponse,
} from '../models/resource.response';

const mapConstraint = (
  constraint: Constraint<any> | undefined
): { constraint?: ConstraintResponse } => {
  if (!constraint) {
    return {};
  }
  const { isValid, generateConstrainedValue, ...rest } = constraint;
  return {
    constraint: {
      ...rest,
      hasGenerator: !!generateConstrainedValue,
      hasValidator: !!isValid,
    },
  };
};

const mapPropertyType = (propType: PropertyType): PropertyTypeResponse => {
  const { constraint, type } = propType;
  const base = {
    ...mapConstraint(constraint),
  };

  switch (type) {
    case Type.Boolean:
    case Type.Int:
    case Type.Float:
    case Type.String:
    case Type.Date:
      return {
        ...base,
        type,
      };
    case Type.Array:
    case Type.Undefinable:
    case Type.Nullable:
      return {
        ...base,
        type,
        inner: mapPropertyType(propType.inner),
      };
    case Type.Complex:
      return {
        ...base,
        type,
        fields: Object.keys(propType.fields).reduce((acc, key) => {
          acc[key] = mapPropertyType(propType.fields[key]);
          return acc;
        }, {} as { [field: string]: PropertyTypeResponse }),
      };
    case Type.Link:
      return {
        ...base,
        type,
        inner: mapPropertyType(propType.inner),
        outputField: propType.outputKey,
        required: propType.required,
        resources: (
          propType.resources as ResourceOrGroupItem<PropertyMap, PropertyMap>[]
        ).map((r) => r.name),
      };
    default:
      throw new Error('Invalid property type');
  }
};

const mapPropertyDefinition = (
  propertyDefinition: PropertyDefinition<any>,
  name: string
): PropertyDefinitionResponse => ({
  type: mapPropertyType(propertyDefinition.type),
  name,
});

const mapPropertyMap = (propertyMap: PropertyMap): PropertyMapResponse =>
  Object.keys(propertyMap).reduce((acc, key) => {
    acc[key] = mapPropertyDefinition(propertyMap[key], key);
    return acc;
  }, {} as PropertyMapResponse);

export const mapResourceToResponse = (
  resource: Resource<PropertyMap, PropertyMap>
): ResourceResponse => ({
  name: resource.name,
  inputs: mapPropertyMap(resource.inputs),
  outputs: mapPropertyMap(resource.outputs),
});
