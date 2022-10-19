import { Resource, PropertyValues, PropertyMap } from './resource';

enum Type {
  Boolean = 'Boolean',
  Number = 'Number',
  String = 'String',
  Nullable = 'Nullable',
  Undefinable = 'Undefinable',
  Array = 'Array',
  Complex = 'Complex',
}

interface BaseConstraint<T> {
  isValid?: (value: T) => boolean;
  generateConstrainedValue?: (values: PropertyValues<PropertyMap>) => T;
}

interface NumberConstraint extends BaseConstraint<unknown> {
  min?: number;
  max?: number;
}

interface StringConstraint extends BaseConstraint<unknown> {
  minLength?: number;
  maxLength?: number;
}

interface ArrayConstraint<T> extends BaseConstraint<T> {
  minItems?: number;
  maxItems?: number;
}

export type Constraint<T> = T extends number
  ? NumberConstraint
  : T extends string
  ? StringConstraint
  : T extends (infer Type)[]
  ? ArrayConstraint<Type>
  : BaseConstraint<T>;

interface PropertyTypeBase {
  type: Type;
  constraint?: Constraint<unknown>;
}

interface BooleanType extends PropertyTypeBase {
  type: Type.Boolean;
}

interface NumberType extends PropertyTypeBase {
  type: Type.Number;
  constraint?: NumberConstraint;
}

interface StringType extends PropertyTypeBase {
  type: Type.String;
  constraint?: StringConstraint;
}

interface ArrayType extends PropertyTypeBase {
  type: Type.Array;
  inner: PropertyType;
  constraint?: ArrayConstraint<unknown>;
}

interface Nullable extends PropertyTypeBase {
  type: Type.Nullable;
  inner: PropertyType;
}

interface Undefinable extends PropertyTypeBase {
  type: Type.Undefinable;
  inner: PropertyType;
}

interface ComplexType extends PropertyTypeBase {
  type: Type.Complex;
  fields: { [name: string]: PropertyType };
}

export type PropertyType =
  | BooleanType
  | NumberType
  | StringType
  | ArrayType
  | Nullable
  | Undefinable
  | ComplexType;

export const isBool = (type: PropertyType): type is BooleanType =>
  (type as any)?.type === Type.Boolean;
export const isNum = (type: PropertyType): type is NumberType =>
  (type as any)?.type === Type.Number;
export const isStr = (type: PropertyType): type is StringType =>
  (type as any)?.type === Type.String;
export const isNullable = (type: PropertyType): type is Nullable =>
  (type as any)?.type === Type.Nullable;
export const isUndefinable = (type: PropertyType): type is Undefinable =>
  (type as any)?.type === Type.Undefinable;
export const isArray = (type: PropertyType): type is ArrayType =>
  (type as any)?.type === Type.Array;
export const isComplex = (type: PropertyType): type is ComplexType =>
  (type as any)?.type === Type.Complex;

type NonUndefined<T> = null extends T ? NonNullable<T> | null : NonNullable<T>;
type NonNull<T> = undefined extends T
  ? NonNullable<T> | undefined
  : NonNullable<T>;

export type PropertyTypeForValue<T> = null extends T
  ? { type: Type.Nullable; inner: PropertyTypeForValue<NonNull<T>> }
  : undefined extends T
  ? { type: Type.Undefinable; inner: PropertyTypeForValue<NonUndefined<T>> }
  : T extends (infer Type)[]
  ? { type: Type.Array; inner: PropertyTypeForValue<Type> }
  : T extends object
  ? {
      type: Type.Complex;
      fields: { [K in keyof T]: PropertyTypeForValue<T[K]> };
    }
  : T extends string
  ? StringType
  : T extends number
  ? NumberType
  : T extends boolean
  ? BooleanType
  : never;

export type TypeForProperty<T> = T extends Nullable
  ? T | null
  : T extends Undefinable
  ? T | undefined
  : T extends ArrayType
  ? TypeForProperty<T['inner']>[]
  : T extends ComplexType
  ? {
      [K in keyof T['fields']]: TypeForProperty<T['fields'][K]['type']>;
    }
  : T extends StringType
  ? string
  : T extends NumberType
  ? number
  : T extends BooleanType
  ? boolean
  : never;

// export interface Constraint<T> {
//   isValid?: (value: T) => boolean;
//   generateConstrainedValue: (values: PropertyValues<PropertyMap>) => T;
// }

export interface PropertyDefinition<T> {
  type: PropertyTypeForValue<T>;
  // constraint?: Constraint<T>;
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

export function isLinkType(
  type: PropertyType
): type is PropertyType & LinkType<unknown> {
  const prop = type as any as LinkType<unknown>;
  return !!prop.resource && !!prop.outputAccessor;
}

interface LinkType<T> {
  resource: Resource<PropertyMap, PropertyMap>;
  outputAccessor: (outputs: PropertyValues<PropertyMap>) => T;
}
export function getLink<T, Out extends PropertyMap>(
  resource: Resource<PropertyMap, Out>,
  propAccessor: (outputs: Out) => PropertyDefinition<T>
): PropertyTypeForValue<T> & LinkType<any> {
  const outputProperty = propAccessor(resource.outputs);
  const outputAccessor: (outputs: PropertyValues<PropertyMap>) => any =
    propAccessor as any;
  return {
    ...outputProperty.type,
    resource,
    outputAccessor,
  };
}

export function bool(): BooleanType {
  return {
    type: Type.Boolean,
  };
}

export function num(): NumberType {
  return {
    type: Type.Number,
  };
}

export function str(): StringType {
  return {
    type: Type.String,
  };
}

export function array<Prop extends PropertyType>(
  prop: Prop
): { type: Type.Array; inner: Prop } {
  return {
    type: Type.Array,
    inner: prop,
  };
}

type ComplexFields<T> = { [F in keyof T]: PropertyTypeForValue<T[F]> };

export function complex<T>(fields: ComplexFields<T>): {
  type: Type.Complex;
  fields: ComplexFields<T>;
} {
  return {
    type: Type.Complex,
    fields,
  };
}

export function constrained<Prop extends PropertyType>(
  property: Prop,
  constraint: Constraint<TypeForProperty<Prop>>
): Prop {
  return {
    ...property,
    constraint,
  };
}

export function createDepdendentConstraint<Inputs extends PropertyMap, Prop>(
  func: (values: PropertyValues<Inputs>) => Prop
): BaseConstraint<Prop> {
  return {
    generateConstrainedValue: func as (
      values: PropertyValues<PropertyMap>
    ) => Prop,
  };
}

export function nullable<Prop extends PropertyType>(
  prop: Prop
): { type: Type.Nullable; inner: Prop } {
  return { type: Type.Nullable, inner: prop };
}

export function undefinable<Prop extends PropertyType>(
  prop: Prop
): { type: Type.Undefinable; inner: Prop } {
  return { type: Type.Undefinable, inner: prop };
}

export function nullOrUndefinable<Prop extends PropertyType>(
  prop: Prop
): {
  type: Type.Nullable;
  inner: { type: Type.Undefinable; inner: Prop };
} {
  return nullable(undefinable(prop));
}
