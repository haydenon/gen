import { PropertyMap, Resource, PropertyValues } from '.';

export interface DesiredState<
  Inputs extends PropertyMap,
  Item extends Resource<Inputs, PropertyMap>
> {
  name: string;
  resource: Item;
  values: Partial<PropertyValues<Inputs>>;
}

let randomId = 1;

export function createDesiredState<
  Item extends Resource<PropertyMap, PropertyMap>
>(
  resource: Item,
  values: Partial<PropertyValues<Item['inputs']>>,
  name?: string
): DesiredState<Item['inputs'], Item> {
  return {
    name: name || `__desiredState${randomId++}`,
    resource,
    values,
  };
}
