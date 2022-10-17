import { Resource, PropertyValues, PropertyMap } from './resource';

// export type ValidTypes = string | number | boolean | null | undefined;

enum MetaType {
  Nullable,
  Undefinable,
}

interface Nullable {
  type: MetaType.Nullable;
  inner: NonNullableType;
}

interface Undefinable {
  type: MetaType.Undefinable;
  inner: NonUndefinableType;
}

type NonUndefinableType = 'Boolean' | 'Number' | 'String';
type NonNullableType = NonUndefinableType | Undefinable;
export type PropertyType = NonNullableType | Nullable;

export const PropertyTypes: {
  Boolean: 'Boolean';
  Number: 'Number';
  String: 'String';
} = {
  Boolean: 'Boolean',
  Number: 'Number',
  String: 'String',
};

export type PropertyValueType<T extends { type: PropertyType }> =
  TypeForProperty<T['type']>;

type NonUndefinableTypeForProperty<T> = T extends 'String'
  ? string
  : T extends 'Number'
  ? number
  : T extends 'Boolean'
  ? boolean
  : never;
type NonNullableTypeForProperty<T> = T extends {
  type: MetaType.Undefinable;
  inner: infer Type;
}
  ? NonUndefinableTypeForProperty<Type> | undefined
  : NonUndefinableTypeForProperty<T>;
export type TypeForProperty<T extends PropertyType> = T extends {
  type: MetaType.Nullable;
  inner: infer Type;
}
  ? NonNullableTypeForProperty<Type> | null
  : NonNullableTypeForProperty<T>;

type NonUndefinableValueType<T> = T extends string
  ? 'String'
  : T extends number
  ? 'Number'
  : T extends boolean
  ? 'Boolean'
  : never;
type NonNullableValueType<T> = undefined extends T
  ? { type: MetaType.Undefinable; inner: NonUndefinableValueType<T> }
  : NonUndefinableValueType<T>;
export type ValueType<T> = null extends T
  ? { type: MetaType.Nullable; inner: NonUndefinableValueType<T> }
  : NonNullableValueType<T>;

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
  property: PropertyDefinition<unknown>
): property is LinkProperty<unknown> {
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

export function nullable<T>(
  prop: PropertyDefinition<T>
): PropertyDefinition<T | null> {
  return {
    ...prop,
    type: { type: MetaType.Nullable, inner: prop.type },
  } as any;
}

export function undefinable<T>(
  prop: PropertyDefinition<T>
): PropertyDefinition<T | undefined> {
  return {
    ...prop,
    type: { type: MetaType.Undefinable, inner: prop.type },
  } as any;
}

export function undefinableOrNullable<T>(
  prop: PropertyDefinition<T>
): PropertyDefinition<T | null | undefined> {
  return nullable(undefinable(prop));
}
