import { PropertyDefinition, PropertyValueType } from './properties';

export interface PropertyMap {
  [name: string]: PropertyDefinition<any>;
}

export type PropertyValues<Props extends PropertyMap> = {
  [P in keyof Props]: PropertyValueType<Props[P]>;
};

type RemoveIndex<T> = {
  [K in keyof T as string extends K
    ? never
    : number extends K
    ? never
    : K]: T[K];
};

export type OutputValues<Props extends PropertyMap> = RemoveIndex<
  PropertyValues<Props>
>;

export abstract class PropertiesBase implements PropertyMap {
  [name: string]: PropertyDefinition<any>;
}

export abstract class Resource<
  Inputs extends PropertyMap,
  Outputs extends PropertyMap
> {
  constructor(public inputs: Inputs, public outputs: Outputs) {}
  abstract create(
    inputs: PropertyValues<Inputs>
  ): Promise<OutputValues<Outputs>>;
  createTimeoutMillis?: number;
}
