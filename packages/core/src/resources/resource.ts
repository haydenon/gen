import { PropertyDefinition } from './properties/properties';
import { RuntimeValue } from './runtime-values';

export interface PropertyMap {
  [name: string]: PropertyDefinition<unknown>;
}

export type PropertyValueType<Prop> = Prop extends PropertyDefinition<
  infer Type
>
  ? Type
  : never;

export type PropertyValues<Props extends PropertyMap> = {
  [P in keyof Props]:
    | PropertyValueType<Props[P]>
    | RuntimeValue<PropertyValueType<Props[P]>>;
};

export type ResolvedValues<Props extends PropertyMap> = {
  [P in keyof Props]: PropertyValueType<Props[P]>;
};

export type RemoveIndex<T> = {
  [K in keyof T as string extends K
    ? never
    : number extends K
    ? never
    : K]: T[K];
};

export type InputValues<Props extends PropertyMap> = RemoveIndex<
  PropertyValues<Props>
>;

export type OutputValues<Props extends PropertyMap> = RemoveIndex<
  ResolvedValues<Props>
>;

export abstract class PropertiesBase implements PropertyMap {
  [name: string]: PropertyDefinition<any>;
}

export interface ResourceGroupItem<
  Inputs extends PropertyMap,
  Outputs extends PropertyMap
> {
  name: string;
  inputs: Inputs;
  outputs: Outputs;

  create(inputs: any): Promise<any>;
}

export abstract class Resource<
  Inputs extends PropertyMap,
  Outputs extends PropertyMap
> {
  public name: string;
  constructor(public inputs: Inputs, public outputs: Outputs, name?: string) {
    this.name = name ?? this.constructor.name;
  }
  abstract create(
    inputs: ResolvedValues<Inputs>
  ): Promise<OutputValues<Outputs>>;
  createTimeoutMillis?: number;
}

export abstract class ResourceGroup<
  In extends PropertyMap,
  Out extends PropertyMap
> {
  public name: string;
  constructor(public items: ResourceGroupItem<In, Out>[], name?: string) {
    this.name = name ?? this.constructor.name;
  }
}

export interface ResourceOrGroupItem<
  Inputs extends PropertyMap,
  Outputs extends PropertyMap
> {
  name: string;
  inputs: Inputs;
  outputs: Outputs;
}
