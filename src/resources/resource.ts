import { PropertyDefinition, RuntimeValue } from './properties/properties';

export interface PropertyMap {
  [name: string]: PropertyDefinition<unknown>;
}

type PropertyValueType<Prop> = Prop extends PropertyDefinition<infer Type>
  ? Type
  : never;

export type PropertyValues<Props extends PropertyMap> = {
  [P in keyof Props]:
    | PropertyValueType<Props[P]>
    | RuntimeValue<PropertyValueType<Props[P]>>;
};

export type ResolvedPropertyValues<Props extends PropertyMap> = {
  [P in keyof Props]: PropertyValueType<Props[P]>;
};

type RemoveIndex<T> = {
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
  ResolvedPropertyValues<Props>
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
    inputs: ResolvedPropertyValues<Inputs>
  ): Promise<OutputValues<Outputs>>;
  createTimeoutMillis?: number;
}

export type ResourceGroup<Out extends PropertyMap> = Resource<
  PropertyMap,
  Out
>[];
