import { PropertyMap, Resource, PropertyValues, InputValues } from '.';

export interface DesiredState {
  name: string;
  resource: Resource<PropertyMap, PropertyMap>;
  inputs: Partial<PropertyValues<PropertyMap>>;
}

let randomId = 1;

export function createDesiredState(
  resource: Resource<PropertyMap, PropertyMap>,
  inputs: Partial<InputValues<PropertyMap>>,
  name?: string
): DesiredState {
  return {
    name: name || `__anonymousStateItem${randomId++}`,
    resource,
    inputs,
  };
}
