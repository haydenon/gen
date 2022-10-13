import { ResourceInstance } from './instance';
import {
  PropertyDefinition,
  PropertyType,
  PropertyValueType,
} from './properties';

export interface PropertyMap {
  [name: string]: PropertyDefinition<PropertyType>;
}

export type PropertyValues<Props extends PropertyMap> = {
  [P in keyof Props]: PropertyValueType<Props[P]>;
};

export abstract class PropertiesBase implements PropertyMap {
  [name: string]: PropertyDefinition<PropertyType>;
}

export abstract class Resource<
  Inputs extends PropertyMap,
  Outputs extends PropertyMap
> {
  constructor(public inputs: Inputs, public outputs: Outputs) {}
  abstract create(
    inputs: PropertyValues<Inputs>
  ): Promise<ResourceInstance<Outputs>>;
  createTimeoutMillis?: number;
}
