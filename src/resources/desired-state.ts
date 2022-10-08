import { InputMap, InputValues, Resource, OutputMap } from '.';

export interface DesiredState<
  Inputs extends InputMap,
  I extends Resource<Inputs, OutputMap>
> {
  resource: I;
  values: InputValues<Inputs>;
}

export function createDesiredState<I extends Resource<InputMap, OutputMap>>(
  resource: I,
  values: InputValues<I['inputs']>
): DesiredState<I['inputs'], I> {
  return {
    resource,
    values,
  };
}
