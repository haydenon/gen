import { ItemInstance } from './instance';
import {
  InputDefinition,
  OutputDefinition,
  PropertyDefinition,
  PropertyType,
} from './properties';

interface PropertyMap<DefinitionType extends PropertyDefinition<PropertyType>> {
  [name: string]: DefinitionType;
}

export type InputMap = PropertyMap<InputDefinition<PropertyType>>;
export type OutputMap = PropertyMap<OutputDefinition<PropertyType>>;

type ValueType<T extends { type: PropertyType }> = T['type'] extends 'String'
  ? string
  : T['type'] extends 'Number'
  ? number
  : boolean;

export type PropertyValues<
  DefinitionType extends PropertyDefinition<PropertyType>,
  Props extends PropertyMap<DefinitionType>
> = {
  [P in keyof Props]: ValueType<Props[P]>;
};

export type OutputValues<Outputs extends OutputMap> = PropertyValues<
  OutputDefinition<PropertyType>,
  Outputs
>;
export type InputValues<Inputs extends InputMap> = PropertyValues<
  InputDefinition<PropertyType>,
  Inputs
>;

export abstract class Item<Inputs extends InputMap, Outputs extends OutputMap> {
  constructor(public inputs: Inputs, public outputs: Outputs) {}
  abstract create(inputs: InputValues<Inputs>): Promise<ItemInstance<Outputs>>;
}
