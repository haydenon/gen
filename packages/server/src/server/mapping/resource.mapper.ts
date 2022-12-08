import { PropertyDefinition, PropertyMap, Resource } from '@haydenon/gen-core';
import type {
  ResourceResponse,
  PropertyMapResponse,
  PropertyDefinitionResponse,
} from '../models';

const mapPropertyDefinition = (
  propertyDefinition: PropertyDefinition<any>
): PropertyDefinitionResponse => ({
  type: propertyDefinition.type,
});

const mapPropertyMap = (propertyMap: PropertyMap): PropertyMapResponse =>
  Object.keys(propertyMap).reduce((acc, key) => {
    acc[key] = mapPropertyDefinition(propertyMap[key]);
    return acc;
  }, {} as PropertyMapResponse);

export const mapResourceToResponse = (
  resource: Resource<PropertyMap, PropertyMap>
): ResourceResponse => ({
  name: resource.name,
  inputs: mapPropertyMap(resource.inputs),
  outputs: mapPropertyMap(resource.outputs),
});
