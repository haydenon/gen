import { ItemInstance } from './instance';
import { InputDefinition, OutputDefinition } from './properties';

interface PropertyMap<T> {
  [name: string]: T;
}

export type InputMap = PropertyMap<InputDefinition>;
export type OutputMap = PropertyMap<OutputDefinition>;

export type InputValues<Inputs extends InputMap> = { [I in keyof Inputs]: any };

export abstract class Item<Inputs extends InputMap, Outputs extends OutputMap> {
  constructor(public inputs: Inputs, public outputs: Outputs) {}
  // abstract inputs: Inputs;
  // abstract outputs: Outputs;
  abstract create(inputs: InputValues<Inputs>): ItemInstance;
}
