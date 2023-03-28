import { PropertyMap, Resource, PropertyValues, InputValues } from './resource';

export interface DesiredState<Res extends Resource<PropertyMap, PropertyMap>> {
  name: string;
  resource: Res;
  inputs: Partial<PropertyValues<Res['inputs']>>;
}

export type ErasedDesiredState = DesiredState<
  Resource<PropertyMap, PropertyMap>
>;

const anonymousIds: { [resourceType: string]: number } = {};

export function createDesiredState<
  Res extends Resource<PropertyMap, PropertyMap>
>(
  resource: Res,
  inputs: Partial<InputValues<Res['inputs']>>,
  name?: string
): DesiredState<Res> {
  const resourceType = resource.name;
  let stateName;
  if (name) {
    stateName = name;
  } else {
    stateName = getAnonymousName(resourceType);
  }
  return {
    name: stateName,
    resource,
    inputs: inputs as Partial<PropertyValues<Res['inputs']>>,
  };
}

export function getAnonymousName(resourceType: string): string {
  if (!anonymousIds[resourceType]) {
    anonymousIds[resourceType] = 1;
  }

  return `__${resourceType}${anonymousIds[resourceType]++}`;
}
