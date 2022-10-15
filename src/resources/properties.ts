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

export type PropertyValueType<T extends { type: PropertyType }> = ValueForType<
  T['type']
>;

export type ValueForType<T extends PropertyType> = T extends 'String'
  ? string
  : T extends 'Number'
  ? number
  : T extends 'Boolean'
  ? boolean
  : never;

export type ValueType<T> = T extends string
  ? 'String'
  : T extends number
  ? 'Number'
  : T extends boolean
  ? 'Boolean'
  : never;

export interface Constraint<T> {
  isValid?: (value: T) => boolean;
  generateConstrainedValue: (values: PropertyValues<PropertyMap>) => T;
}

export interface PropertyDefinition<T> {
  type: ValueType<T>;
  constraint?: Constraint<T>;
}

export type PrimativeProperty<T> = PropertyDefinition<T>;

export interface LinkProperty<T> extends PropertyDefinition<T> {
  item: Resource<PropertyMap, PropertyMap>;
  outputAccessor: (outputs: PropertyValues<PropertyMap>) => ValueType<T>;
}

export function isLinkProperty(
  property: PropertyDefinition<PropertyType>
): property is LinkProperty<PropertyType> {
  const prop = property as any;
  return prop.item && prop.outputAccessor;
}

export function getLink<Out extends PropertyMap, Prop>(
  resource: Resource<PropertyMap, Out>,
  fieldAccessor: (outputs: Out) => PropertyDefinition<Prop>
): LinkProperty<Prop> {
  const outputProperty = fieldAccessor(resource.outputs);
  return {
    type: outputProperty.type,
    item: resource,
    // The accessor is common between property access and value access
    outputAccessor: fieldAccessor as any,
    constraint: outputProperty.constraint,
  };
}

export function constrained<T>(
  property: PropertyDefinition<T>,
  constraint: Constraint<T>
): PropertyDefinition<T> {
  return {
    ...property,
    constraint,
  };
}

export function createDepdendentConstraint<Inputs extends PropertyMap, Prop>(
  func: (values: PropertyValues<Inputs>) => Prop
): Constraint<Prop> {
  return {
    generateConstrainedValue: func as (
      values: PropertyValues<PropertyMap>
    ) => Prop,
  };
}

const createPrimative = <T>(type: ValueType<T>): PrimativeProperty<T> => ({
  type,
});

export const Primatives = {
  String: createPrimative<string>(PropertyTypes.String),
  Boolean: createPrimative<boolean>(PropertyTypes.Boolean),
  Number: createPrimative<number>(PropertyTypes.Number),
};
