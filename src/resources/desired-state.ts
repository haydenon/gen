import { PropertyMap, Resource, PropertyValues } from '.';

export interface DesiredState {
  name: string;
  resource: Resource<PropertyMap, PropertyMap>;
  inputs: Partial<PropertyValues<PropertyMap>>;
}

let randomId = 1;

export function createDesiredState(
  resource: Resource<PropertyMap, PropertyMap>,
  inputs: Partial<PropertyValues<PropertyMap>>,
  name?: string
): DesiredState {
  return {
    name: name || `__anonymousStateItem${randomId++}`,
    resource,
    inputs,
  };
}
