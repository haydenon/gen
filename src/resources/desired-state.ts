import { InputMap, InputValues, Resource, OutputMap } from '.';

export interface DesiredState<
  Inputs extends InputMap,
  Item extends Resource<Inputs, OutputMap>
> {
  resource: Item;
  values: Partial<InputValues<Inputs>>;
}

export function createDesiredState<Item extends Resource<InputMap, OutputMap>>(
  resource: Item,
  values: Partial<InputValues<Item['inputs']>>
): DesiredState<Item['inputs'], Item> {
  return {
    resource,
    values,
  };
}
