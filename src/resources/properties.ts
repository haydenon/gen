import { InputMap, Resource, OutputMap } from './resource';

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

export type PropertyValueType<T extends { type: PropertyType }> = ValueType<
  T['type']
>;

type ValueType<T extends PropertyType> = T extends 'String'
  ? string
  : T extends 'Number'
  ? number
  : boolean;

export interface Constraint<T extends PropertyType> {
  isValid: (value: ValueType<T>) => boolean;
  generateConstrainedValue: () => ValueType<T>;
}

export interface PropertyDefinition<T extends PropertyType> {
  type: T;
  constraint?: Constraint<T>;
}

export type PrimativeProperty<T extends PropertyType> = PropertyDefinition<T>;

export interface LinkProperty<T extends PropertyType>
  extends PropertyDefinition<T> {
  item: Resource<InputMap, OutputMap>;
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
>(
  resource: Resource<In, Out>,
  field: OutField
): LinkProperty<Out[OutField]['type']> {
  return {
    type: resource.outputs[field].type,
    item: resource,
    output: field,
    constraint: resource.outputs[field].constraint,
  };
}

export function constrained<T extends PropertyType>(
  property: PropertyDefinition<T>,
  constraint: Constraint<T>
): PropertyDefinition<T> {
  return {
    ...property,
    constraint,
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
