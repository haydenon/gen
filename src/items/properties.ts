import { InputMap, Item, OutputMap } from './item';

export type PropertyType = 'Boolean' | 'Number' | 'String';

export const PropertyTypes: {
  Boolean: 'Boolean';
  Number: 'Number';
  String: 'String';
} = {
  Boolean: 'Boolean',
  Number: 'Number',
  String: 'String',
};

export interface PropertyDefinition<T extends PropertyType> {
  type: T;
}

export type PrimativeProperty<T extends PropertyType> = PropertyDefinition<T>;

export interface LinkProperty<T extends PropertyType>
  extends PropertyDefinition<T> {
  item: Item<InputMap, OutputMap>;
  output: string | number | symbol;
}

export type InputDefinition<T extends PropertyType> =
  | PrimativeProperty<T>
  | LinkProperty<T>;

export type OutputDefinition<T extends PropertyType> = PropertyDefinition<T>;

export function getLink<
  In extends InputMap,
  Out extends OutputMap,
  OutField extends keyof Out
>(item: Item<In, Out>, field: OutField): LinkProperty<Out[OutField]['type']> {
  return {
    type: item.outputs[field].type,
    item,
    output: field,
  };
}

const createPrimative = <T extends PropertyType>(
  type: T
): PrimativeProperty<T> => ({
  type,
});

export const Primatives = {
  String: createPrimative(PropertyTypes.String),
  Boolean: createPrimative(PropertyTypes.Boolean),
  Number: createPrimative(PropertyTypes.Number),
};
