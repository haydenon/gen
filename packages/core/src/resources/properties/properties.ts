import { getLookupValues, isOneOf, LookupValues, oneOf } from '../../utilities';
import { ErasedDesiredState } from '../desired-state';
import { PropertyMap, OutputValues, ResourceOrGroupItem } from '../resource';
import { RuntimeValue } from '../runtime-values';
import {
  ArrayConstraint,
  Constraint,
  DateConstraint,
  FloatConstraint,
  IntConstraint,
  StringConstraint,
  LinkConstraint,
} from './constraints';
import { ParentCreationMode } from './links';

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
  Link = 'Link',
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
  constraint?: ArrayConstraint<any>;
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

export interface LinkOfType<
  Res extends ResourceOrGroupItem<PropertyMap, PropertyMap>,
  T,
  Required extends boolean
> {
  type: Type.Link;
  inner: T;
  required: Required;
  resources: Res[];
  outputKey: string;
  constraint?: LinkConstraint<any>;
}

export interface LinkType<
  Parent extends ResourceOrGroupItem<PropertyMap, PropertyMap>
> extends PropertyTypeBase {
  type: Type.Link;
  constraint?: LinkConstraint<any>;
  inner: PropertyType;
  required: boolean;
  resources: Parent[];
  outputKey: string;
  mode?: ParentCreationMode;
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
  | ComplexType
  | LinkType<any>;

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
  ?
      | { type: Type.Undefinable; inner: PropertyTypeForValue<NonUndefined<T>> }
      | LinkOfType<any, StringType, false>
      | LinkOfType<any, IntType, false>
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
  ? StringType | LinkOfType<any, StringType, true>
  : T extends number
  ? IntType | FloatType | LinkOfType<any, IntType, true>
  : T extends boolean
  ? BooleanType
  : never;

type NonNullableUndefinableTypeForPropertyType<T> = T extends {
  type: Type.Array;
  inner: infer Inner;
}
  ? TypeForPropertyType<Inner>[]
  : T extends DateType
  ? Date
  : T extends { type: Type.Complex; fields: infer Fields }
  ? {
      [K in keyof Fields]: TypeForPropertyType<Fields[K]>;
    }
  : T extends StringType
  ? string
  : T extends IntType | FloatType
  ? number
  : T extends BooleanType
  ? boolean
  : never;

type NonNullableTypeForPropertyType<T> = T extends {
  type: Type.Undefinable;
  inner: infer Inner;
}
  ? NonNullableUndefinableTypeForPropertyType<Inner> | undefined
  : NonNullableUndefinableTypeForPropertyType<T>;

export type TypeForPropertyType<T> = T extends {
  type: Type.Nullable;
  inner: infer Inner;
}
  ? NonNullableTypeForPropertyType<Inner> | null
  : NonNullableTypeForPropertyType<T>;

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
  description?: string;
}

export function def<T>(
  type: PropertyTypeForValue<T>,
  description?: string
): PropertyDefinition<T> {
  return {
    type,
    description,
  };
}

export function lookup<Prop extends PropertyType>(
  property: Prop,
  values: LookupValues<TypeForPropertyType<Prop>>
): Prop {
  return {
    ...property,
    constraint: {
      validValues: getLookupValues(values),
      isValid: (value: TypeForPropertyType<Prop>) => isOneOf(values, value),
      generateConstrainedValue:
        property.constraint?.generateConstrainedValue ?? (() => oneOf(values)),
    },
  };
}

interface ParentNode<T> {
  name: string;
  children: TreeNode<T>[];
  value: T;
}

interface LeafNode<T> {
  name: string;
  value: T;
}

export function isParent<T>(treeNode: TreeNode<T>): treeNode is ParentNode<T> {
  return 'children' in treeNode;
}

export function isLeaf<T>(treeNode: TreeNode<T>): treeNode is LeafNode<T> {
  return !isParent(treeNode);
}

export type TreeNode<T> = ParentNode<T> | LeafNode<T>;

export function tree<Prop extends PropertyType>(
  property: Prop,
  values: TreeNode<TypeForPropertyType<Prop>>
): Prop {
  type PropType = TypeForPropertyType<Prop>;
  const allLeaves: PropType[] = [];
  const getLeaves = (node: TreeNode<PropType>): void => {
    if (isParent(node)) {
      for (const child of node.children) {
        getLeaves(child);
      }
    } else {
      allLeaves.push(node.value);
    }
  };
  getLeaves(values);
  return {
    ...property,
    constraint: {
      tree: values,
      validValues: allLeaves,
      isValid: (value: TypeForPropertyType<Prop>) => isOneOf(allLeaves, value),
      generateConstrainedValue:
        property.constraint?.generateConstrainedValue ??
        (() => oneOf(allLeaves)),
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
  constraint?: ArrayConstraint<TypeForPropertyType<Prop>>
): {
  type: Type.Array;
  inner: Prop;
  constraint?: ArrayConstraint<TypeForPropertyType<Prop>>;
} {
  return {
    type: Type.Array,
    inner: prop,
    constraint: constraint as ArrayConstraint<TypeForPropertyType<Prop>>,
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
  prop: Prop,
  constraint?: Constraint<NonNullableTypeForPropertyType<Prop> | null>
): {
  type: Type.Nullable;
  inner: Prop;
  constraint?: Constraint<NonNullableTypeForPropertyType<Prop> | null>;
} {
  return { type: Type.Nullable, inner: prop, constraint };
}

export function undefinable<Prop extends PropertyType>(
  prop: Prop,
  constraint?: Constraint<
    NonNullableUndefinableTypeForPropertyType<Prop> | undefined
  >
): {
  type: Type.Undefinable;
  inner: Prop;
  constraint?: Constraint<
    NonNullableUndefinableTypeForPropertyType<Prop> | undefined
  >;
} {
  return {
    type: Type.Undefinable,
    inner: prop,
    constraint,
  };
}

export function nullOrUndefinable<Prop extends PropertyType>(
  prop: Prop,
  constraint?: Constraint<
    NonNullableUndefinableTypeForPropertyType<Prop> | null | undefined
  >
): {
  type: Type.Nullable;
  inner: { type: Type.Undefinable; inner: Prop };
  constraint?: Constraint<
    NonNullableUndefinableTypeForPropertyType<Prop> | null | undefined
  >;
} {
  return nullable(undefinable(prop), constraint);
}
