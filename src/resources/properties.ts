import { Resource, PropertyValues, PropertyMap } from './resource';

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

export type ValueType<T extends PropertyType> = T extends 'String'
  ? string
  : T extends 'Number'
  ? number
  : T extends 'Boolean'
  ? boolean
  : never;

export type Type<T> = T extends string
  ? 'String'
  : T extends number
  ? 'Number'
  : T extends boolean
  ? 'Boolean'
  : never;

export interface Constraint<T extends PropertyType> {
  isValid?: (value: ValueType<T>) => boolean;
  generateConstrainedValue: (
    values: PropertyValues<PropertyMap>
  ) => ValueType<T>;
}

export interface PropertyDefinition<T extends PropertyType> {
  type: T;
  constraint?: Constraint<T>;
}

export type PrimativeProperty<T extends PropertyType> = PropertyDefinition<T>;

export interface LinkProperty<T extends PropertyType>
  extends PropertyDefinition<T> {
  item: Resource<PropertyMap, PropertyMap>;
  outputAccessor: (outputs: PropertyValues<PropertyMap>) => ValueType<T>;
}

export function getLink<Out extends PropertyMap, Prop extends PropertyType>(
  resource: Resource<PropertyMap, Out>,
  fieldAccessor: (outputs: Out) => PropertyDefinition<Prop>
): LinkProperty<Prop> {
  const outputProperty = fieldAccessor(resource.outputs);
  return {
    type: outputProperty.type,
    item: resource,
    // The accessor is common between property access and value access
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    outputAccessor: fieldAccessor as any,
    constraint: outputProperty.constraint,
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

export function createDepdendentConstraint<
  Inputs extends PropertyMap,
  Prop extends PropertyType
>(func: (values: PropertyValues<Inputs>) => ValueType<Prop>): Constraint<Prop> {
  return {
    generateConstrainedValue: func as (
      values: PropertyValues<PropertyMap>
    ) => ValueType<Prop>,
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
