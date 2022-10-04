import { InputMap, InputValues, Item, OutputMap } from '../items';

export interface DesiredState<
  Inputs extends InputMap,
  I extends Item<Inputs, OutputMap>
> {
  item: I;
  values: InputValues<Inputs>;
}

export function createDesiredState<I extends Item<InputMap, OutputMap>>(
  item: I,
  values: InputValues<I['inputs']>
): DesiredState<I['inputs'], I> {
  return {
    item,
    values,
  };
}
