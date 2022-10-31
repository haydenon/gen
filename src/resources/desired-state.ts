import { PropertyMap, Resource, PropertyValues, InputValues } from './resource';

export interface DesiredState<Res extends Resource<PropertyMap, PropertyMap>> {
  name: string;
  resource: Res;
  inputs: Partial<PropertyValues<Res['inputs']>>;
}

export type ErasedDesiredState = DesiredState<Resource<PropertyMap, PropertyMap>>;

let randomId = 1;

export function createDesiredState<
  Res extends Resource<PropertyMap, PropertyMap>
>(
  resource: Res,
  inputs: Partial<InputValues<Res['inputs']>>,
  name?: string
): DesiredState<Res> {
  return {
    name: name || `__anonymousStateItem${randomId++}`,
    resource,
    inputs: inputs as Partial<PropertyValues<Res['inputs']>>,
  };
}
