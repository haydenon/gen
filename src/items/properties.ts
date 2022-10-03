import { InputMap, Item, OutputMap } from './item';

export enum PropertyType {
  Boolean = 'Boolean',
  Number = 'Number',
  String = 'String',
}

export interface PrimativeProperty {
  type: PropertyType;
}

export interface LinkProperty {
  item: Item<InputMap, OutputMap>;
  output: string | number | symbol;
}

export type InputDefinition = PrimativeProperty | LinkProperty;

export interface OutputDefinition {
  type: PropertyType;
}

export function getLink<In extends InputMap, Out extends OutputMap>(
  item: Item<In, Out>,
  field: keyof Out
): LinkProperty {
  return {
    item,
    output: field,
  };
}

const createPrimative = (type: PropertyType): PrimativeProperty => ({
  type,
});

export const Primatives = {
  String: createPrimative(PropertyType.String),
  Boolean: createPrimative(PropertyType.Boolean),
  Number: createPrimative(PropertyType.Number),
};
