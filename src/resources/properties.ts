import { isOneOf, LookupValues, oneOf } from '../utilities';
import { DesiredState } from './desired-state';
import { Resource, PropertyValues, PropertyMap } from './resource';

enum Type {
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

export class GenerationResult {
  private constructor(public wasGenerated: boolean) {}
  static ValueNotGenerated = new GenerationResult(true);
}

interface BaseConstraint<T> {
  isValid?: (value: T) => boolean;
  generateConstrainedValue?: (
    values: PropertyValues<PropertyMap>,
    related: RelatedResources
  ) => T | GenerationResult;
}

interface IntConstraint extends BaseConstraint<number> {
  min?: number;
  max?: number;
  float?: boolean;
  precision?: number;
}

interface FloatConstraint extends BaseConstraint<number> {
  min?: number;
  max?: number;
  precision?: number;
}

interface DateConstraint extends BaseConstraint<Date> {
  minDate?: Date;
  maxDate?: Date;
}

interface StringConstraint extends BaseConstraint<string> {
  minLength?: number;
  maxLength?: number;
}

interface ArrayConstraint<T> extends BaseConstraint<T> {
  minItems?: number;
  maxItems?: number;
}

export type Constraint<T> = null extends T
  ? BaseConstraint<T>
  : undefined extends T
  ? BaseConstraint<T>
  : T extends number
  ? IntConstraint | FloatConstraint
  : T extends string
  ? StringConstraint
  : T extends (infer Type)[]
  ? ArrayConstraint<Type>
  : T extends Date
  ? DateConstraint
  : BaseConstraint<T>;

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

type NonNullTypeForProp<T> = T extends Nullable ? never : T;
type NonUndefinedTypeForProp<T> = T extends Undefinable | Nullable ? never : T;

export type TypeForProperty<T> = T extends Nullable
  ? TypeForProperty<NonNullTypeForProp<T['inner']>> | null
  : T extends Undefinable
  ? TypeForProperty<NonUndefinedTypeForProp<T['inner']>> | undefined
  : T extends ArrayType
  ? TypeForProperty<T['inner']>[]
  : T extends DateType
  ? Date
  : T extends ComplexType
  ? {
      [K in keyof T['fields']]: TypeForProperty<T['fields'][K]['type']>;
    }
  : T extends StringType
  ? string
  : T extends FloatType | IntType
  ? number
  : T extends BooleanType
  ? boolean
  : never;

export function acceptPropertyType<T>(
  visitor: PropertyTypeVisitor<T>,
  type: PropertyType
): T {
  if (visitor.visitLink && isLinkType(type)) {
    return visitor.visitLink(type);
  } else if (isComplex(type)) {
    return visitor.visitComplex(type);
  } else if (isArray(type)) {
    return visitor.visitArray(type);
  } else if (isNullable(type)) {
    return visitor.visitNull(type);
  } else if (isUndefinable(type)) {
    return visitor.visitUndefined(type);
  } else if (isBool(type)) {
    return visitor.visitBool(type);
  } else if (isInt(type)) {
    return visitor.visitInt(type);
  } else if (isFloat(type)) {
    return visitor.visitFloat(type);
  } else if (isDate(type)) {
    return visitor.visitDate(type);
  } else {
    return visitor.visitStr(type);
  }
}

export interface PropertyTypeVisitor<T> {
  visitBool: (type: BooleanType) => T;
  visitInt: (type: IntType) => T;
  visitFloat: (type: FloatType) => T;
  visitStr: (type: StringType) => T;
  visitDate: (type: DateType) => T;
  visitArray: (type: ArrayType) => T;
  visitNull: (type: Nullable) => T;
  visitUndefined: (type: Undefinable) => T;
  visitComplex: (type: ComplexType) => T;
  visitLink?: (type: LinkType<any>) => T;
}

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
  return !!prop.resources && !!prop.outputAccessor;
}

export interface LinkType<T> {
  resources: Resource<PropertyMap, PropertyMap>[];
  outputAccessor: (outputs: PropertyValues<PropertyMap>) => T;
}

export function getLink<T, Out extends PropertyMap>(
  resource: Resource<PropertyMap, Out>,
  propAccessor: (outputs: Out) => PropertyDefinition<T>
): PropertyTypeForValue<T> & LinkType<any>;
export function getLink<T, Out extends PropertyMap>(
  resources: Resource<PropertyMap, Out>[],
  propAccessor: (outputs: Out) => PropertyDefinition<T>
): PropertyTypeForValue<T> & LinkType<any>;
export function getLink<T, Out extends PropertyMap>(
  resources: Resource<PropertyMap, Out> | Resource<PropertyMap, Out>[],
  propAccessor: (outputs: Out) => PropertyDefinition<T>
): PropertyTypeForValue<T> & LinkType<any> {
  const outputProperty = propAccessor(
    resources instanceof Array ? resources[0].outputs : resources.outputs
  );
  const outputAccessor: (outputs: PropertyValues<PropertyMap>) => any =
    propAccessor as any;
  return {
    ...outputProperty.type,
    resources: resources instanceof Array ? resources : [resources],
    outputAccessor,
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

export function bool(): BooleanType {
  return {
    type: Type.Boolean,
  };
}

export function int(): IntType {
  return {
    type: Type.Int,
  };
}

export function float(): FloatType {
  return {
    type: Type.Float,
  };
}

export function str(): StringType {
  return {
    type: Type.String,
  };
}

export function date(): DateType {
  return {
    type: Type.Date,
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

export function constrain<Prop extends PropertyType>(
  property: Prop,
  constraint: Constraint<TypeForProperty<Prop>>
): Prop {
  return {
    ...property,
    constraint,
  };
}

interface RelatedResources {
  children: DesiredState[];
}

export function dependentGenerator<Inputs extends PropertyMap, Prop>(
  func: (
    values: PropertyValues<Inputs>,
    related: RelatedResources
  ) => Prop | GenerationResult
): BaseConstraint<Prop> {
  return {
    generateConstrainedValue: func as (
      values: PropertyValues<PropertyMap>,
      related: RelatedResources
    ) => Prop,
  };
}

export function generator<Prop>(
  func: () => Prop | GenerationResult
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
