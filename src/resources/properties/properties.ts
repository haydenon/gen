import { isOneOf, LookupValues, oneOf } from '../../utilities';
import { ErasedDesiredState } from '../desired-state';
import { PropertyMap, OutputValues } from '../resource';
import { RuntimeValue } from '../runtime-values';
import {
  ArrayConstraint,
  Constraint,
  DateConstraint,
  FloatConstraint,
  IntConstraint,
  StringConstraint,
} from './constraints';

export enum Type {
  Boolean = 'Boolean',
  Int = 'Int',
  Float = 'Float',
  String = 'String',
  Date = 'Date',
  Nullable = 'Nullable',
  Undefinable = 'Undefinable',
  Array = 'Array',
  Complex = 'Complex',
}

interface PropertyTypeBase {
  type: Type;
  constraint?: Constraint<any>;
}

export interface BooleanType extends PropertyTypeBase {
  type: Type.Boolean;
}

export interface IntType extends PropertyTypeBase {
  type: Type.Int;
  constraint?: IntConstraint;
}

export interface FloatType extends PropertyTypeBase {
  type: Type.Float;
  constraint?: FloatConstraint;
}

export interface StringType extends PropertyTypeBase {
  type: Type.String;
  constraint?: StringConstraint;
}

export interface DateType extends PropertyTypeBase {
  type: Type.Date;
  constraint?: DateConstraint;
}

export interface ArrayType extends PropertyTypeBase {
  type: Type.Array;
  inner: PropertyType;
  constraint?: ArrayConstraint<unknown>;
}

export interface Nullable extends PropertyTypeBase {
  type: Type.Nullable;
  inner: PropertyType;
}

export interface Undefinable extends PropertyTypeBase {
  type: Type.Undefinable;
  inner: PropertyType;
}

export interface ComplexType extends PropertyTypeBase {
  type: Type.Complex;
  fields: { [name: string]: PropertyType };
}

export type PropertyType =
  | BooleanType
  | FloatType
  | IntType
  | StringType
  | DateType
  | ArrayType
  | Nullable
  | Undefinable
  | ComplexType;

export const isBool = (type: PropertyType): type is BooleanType =>
  (type as any)?.type === Type.Boolean;
export const isFloat = (type: PropertyType): type is FloatType =>
  (type as any)?.type === Type.Float;
export const isInt = (type: PropertyType): type is IntType =>
  (type as any)?.type === Type.Int;
export const isDate = (type: PropertyType): type is DateType =>
  (type as any)?.type === Type.Date;
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
  : T extends Date
  ? DateType
  : T extends object
  ? {
      type: Type.Complex;
      fields: { [K in keyof T]: PropertyTypeForValue<T[K]> };
    }
  : T extends string
  ? StringType
  : T extends number
  ? IntType | FloatType
  : T extends boolean
  ? BooleanType
  : never;

export type TypeForProperty<T> = T extends PropertyDefinition<infer Type>
  ? Type
  : never;

interface CreatedStateForDesired {
  desiredState: ErasedDesiredState;
  createdState: OutputValues<PropertyMap>;
}

export interface CreatedState {
  [desiredStateName: string]: CreatedStateForDesired;
}

export type Value<T> = T | RuntimeValue<T>;

export interface PropertyDefinition<T> {
  type: PropertyTypeForValue<T>;
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

export function lookup<Prop extends PropertyType>(
  property: Prop,
  values: LookupValues<TypeForProperty<Prop>>
): Prop {
  return {
    ...property,
    constraint: {
      isValid: (value: TypeForProperty<Prop>) => isOneOf(values, value),
      generateConstrainedValue: () => oneOf(values),
    },
  };
}

export function bool(constraint?: Constraint<boolean>): BooleanType {
  return {
    type: Type.Boolean,
    constraint,
  };
}

export function int(constraint?: IntConstraint): IntType {
  return {
    type: Type.Int,
    constraint,
  };
}

export function float(constraint?: FloatConstraint): FloatType {
  return {
    type: Type.Float,
    constraint,
  };
}

export function string(constraint?: Constraint<string>): StringType {
  return {
    type: Type.String,
    constraint,
  };
}

export function date(constraint?: Constraint<Date>): DateType {
  return {
    type: Type.Date,
    constraint,
  };
}

export function array<Prop extends PropertyType>(
  prop: Prop,
  constraint?: Constraint<Prop[]>
): { type: Type.Array; inner: Prop; constraint?: ArrayConstraint<unknown> } {
  return {
    type: Type.Array,
    inner: prop,
    constraint: constraint as ArrayConstraint<unknown>,
  };
}

type ComplexFields<T> = { [F in keyof T]: PropertyTypeForValue<T[F]> };

export function complex<T>(
  fields: ComplexFields<T>,
  constraint?: Constraint<T>
): {
  type: Type.Complex;
  fields: ComplexFields<T>;
  constraint?: Constraint<any>;
} {
  return {
    type: Type.Complex,
    fields,
    constraint,
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
