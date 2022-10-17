import { Resource, PropertyValues, PropertyMap } from './resource';

enum MetaType {
  Nullable = 'Nullable',
  Undefinable = 'Undefinable',
  Array = 'Array',
  Complex = 'Complex',
}

interface ArrayType {
  type: MetaType.Array;
  inner: PropertyType;
}

interface Nullable {
  type: MetaType.Nullable;
  inner: PropertyType;
}

interface Undefinable {
  type: MetaType.Undefinable;
  inner: PropertyType;
}

interface ComplexType {
  type: MetaType.Complex;
  fields: { [name: string]: PropertyType };
}

export type PropertyType =
  | 'Boolean'
  | 'Number'
  | 'String'
  | ArrayType
  | Nullable
  | Undefinable
  | ComplexType;

export const isNullable = (type: PropertyType): type is Nullable =>
  (type as any)?.type === MetaType.Nullable;
export const isUndefinable = (type: PropertyType): type is Nullable =>
  (type as any)?.type === MetaType.Nullable;

export const Props: {
  Boolean: 'Boolean';
  Number: 'Number';
  String: 'String';
} = {
  Boolean: 'Boolean',
  Number: 'Number',
  String: 'String',
};

type NonUndefined<T> = null extends T ? NonNullable<T> | null : NonNullable<T>;
type NonNull<T> = undefined extends T
  ? NonNullable<T> | undefined
  : NonNullable<T>;

export type PropertyTypeForValue<T> = null extends T
  ? { type: MetaType.Nullable; inner: PropertyTypeForValue<NonNull<T>> }
  : undefined extends T
  ? { type: MetaType.Undefinable; inner: PropertyTypeForValue<NonUndefined<T>> }
  : T extends (infer Type)[]
  ? { type: MetaType.Array; inner: PropertyTypeForValue<Type> }
  : T extends object
  ? {
      type: MetaType.Complex;
      fields: { [K in keyof T]: PropertyTypeForValue<T[K]> };
    }
  : T extends string
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
  type: PropertyTypeForValue<T>;
  constraint?: Constraint<T>;
}

export function def<T>(
  type: PropertyTypeForValue<T>,
  properties?: Partial<Omit<PropertyDefinition<T>, 'type'>>
): PropertyDefinition<T> {
  return {
    type,
    ...(properties || {}),
  };
}

export interface LinkProperty<T> extends PropertyDefinition<T> {
  item: Resource<PropertyMap, PropertyMap>;
  outputAccessor: (
    outputs: PropertyValues<PropertyMap>
  ) => PropertyTypeForValue<T>;
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

export function array<Prop extends PropertyType>(
  prop: Prop
): { type: MetaType.Array; inner: Prop } {
  return {
    type: MetaType.Array,
    inner: prop,
  };
}

type ComplexFields<T> = { [F in keyof T]: PropertyTypeForValue<T[F]> };

export function complex<T>(fields: ComplexFields<T>): {
  type: MetaType.Complex;
  fields: ComplexFields<T>;
} {
  return {
    type: MetaType.Complex,
    fields,
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

export function nullable<Prop extends PropertyType>(
  prop: Prop
): { type: MetaType.Nullable; inner: Prop } {
  return { type: MetaType.Nullable, inner: prop };
}

export function undefinable<Prop extends PropertyType>(
  prop: Prop
): { type: MetaType.Undefinable; inner: Prop } {
  return { type: MetaType.Undefinable, inner: prop };
}

export function nullOrUndefinable<Prop extends PropertyType>(
  prop: Prop
): {
  type: MetaType.Nullable;
  inner: { type: MetaType.Undefinable; inner: Prop };
} {
  return nullable(undefinable(prop));
}
