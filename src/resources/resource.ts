import { ResourceInstance } from './instance';
import {
  InputDefinition,
  OutputDefinition,
  PropertyDefinition,
  PropertyType,
  PropertyValueType,
} from './properties';

interface PropertyMap<DefinitionType extends PropertyDefinition<PropertyType>> {
  [name: string]: DefinitionType;
}

export type InputMap = PropertyMap<InputDefinition<PropertyType>>;
export abstract class InputBase implements InputMap {
  [name: string]: InputDefinition<PropertyType>;
}

export type OutputMap = PropertyMap<OutputDefinition<PropertyType>>;
export abstract class OutputBase implements OutputMap {
  [name: string]: OutputDefinition<PropertyType>;
}

export type PropertyValues<
  DefinitionType extends PropertyDefinition<PropertyType>,
  Props extends PropertyMap<DefinitionType>
> = {
  [P in keyof Props]: PropertyValueType<Props[P]>;
};

export type OutputValues<Outputs extends OutputMap> = PropertyValues<
  OutputDefinition<PropertyType>,
  Outputs
>;
export type InputValues<Inputs extends InputMap> = PropertyValues<
  InputDefinition<PropertyType>,
  Inputs
>;

export abstract class Resource<
  Inputs extends InputBase,
  Outputs extends OutputBase
> {
  constructor(public inputs: Inputs, public outputs: Outputs) {}
  abstract create(
    inputs: InputValues<Inputs>
  ): Promise<ResourceInstance<Outputs>>;
  createTimeoutMillis?: number;
}
