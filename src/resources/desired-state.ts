import { InputMap, InputValues, Resource, OutputMap } from '.';

export interface DesiredState<
  Inputs extends InputMap,
  Item extends Resource<Inputs, OutputMap>
> {
  name: string;
  resource: Item;
  values: Partial<InputValues<Inputs>>;
}

let randomId = 1;

export function createDesiredState<Item extends Resource<InputMap, OutputMap>>(
  resource: Item,
  values: Partial<InputValues<Item['inputs']>>,
  name?: string
): DesiredState<Item['inputs'], Item> {
  return {
    name: name || `__desiredState${randomId++}`,
    resource,
    values,
  };
}
