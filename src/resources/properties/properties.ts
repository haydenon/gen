import { isOneOf, LookupValues, oneOf } from '../../utilities';
import { DesiredState, ErasedDesiredState } from '../desired-state';
import {
  Resource,
  PropertyValues,
  PropertyMap,
  OutputValues,
  ResolvedPropertyValues,
} from '../resource';

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

export class GenerationResult {
  private constructor(public wasGenerated: boolean) {}
  static ValueNotGenerated = new GenerationResult(true);
}

export interface BaseConstraint<T> {
  isValid?: (value: T) => boolean;
  generateConstrainedValue?: (
    values: PropertyValues<PropertyMap>,
    related: RelatedResources
  ) => T | RuntimeValue<T> | GenerationResult;
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
  if (isComplex(type)) {
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
}

export abstract class ValueAndPropertyVisitor<T>
  implements PropertyTypeVisitor<T>
{
  constructor(private value: any) {}

  visitBool = (type: BooleanType) => this.visitBoolValue(type, this.value);
  visitInt = (type: IntType) => this.visitIntValue(type, this.value);
  visitFloat = (type: FloatType) => this.visitFloatValue(type, this.value);
  visitStr = (type: StringType) => this.visitStrValue(type, this.value);
  visitDate = (type: DateType) => this.visitDateValue(type, this.value);
  visitArray = (type: ArrayType) => {
    if (this.checkArrayValue) {
      const [processed, value] = this.checkArrayValue(type, this.value);
      if (processed) {
        return value;
      }
    }
    const arr = this.value as any[];
    const innerType = type.inner;
    const result: any[] = arr.map((item) => {
      this.value = item;
      return acceptPropertyType(this, innerType);
    });
    this.value = arr;
    return this.mapArrayValue(type, result);
  };
  visitNull = (type: Nullable): T =>
    this.value === null
      ? this.mapNullValue(type)
      : acceptPropertyType<T>(this, type.inner);
  visitUndefined = (type: Undefinable): T =>
    this.value === undefined
      ? this.mapUndefinedValue(type)
      : acceptPropertyType<T>(this, type.inner);
  visitComplex = (type: ComplexType): T => {
    if (this.checkComplexValue) {
      const [processed, value] = this.checkComplexValue(type, this.value);
      if (processed) {
        return value;
      }
    }
    const fields = type.fields;
    const originalValue = this.value;
    const result = Object.keys(type.fields).reduce((acc, key) => {
      this.value = originalValue ? originalValue[key] : undefined;
      acc[key] = acceptPropertyType<T>(this, fields[key]);
      return acc;
    }, {} as { [key: string]: T });
    this.value = originalValue;
    return this.mapComplexValue(type, result);
  };

  protected abstract visitBoolValue: (type: BooleanType, value: any) => T;
  protected abstract visitIntValue: (type: IntType, value: any) => T;
  protected abstract visitFloatValue: (type: FloatType, value: any) => T;
  protected abstract visitStrValue: (type: StringType, value: any) => T;
  protected abstract visitDateValue: (type: DateType, value: any) => T;
  protected abstract mapNullValue: (type: Nullable) => T;
  protected abstract mapUndefinedValue: (type: Undefinable) => T;
  protected abstract checkArrayValue?: (
    type: ArrayType,
    value: any
  ) => [true, T] | [false];
  protected abstract mapArrayValue: (type: ArrayType, value: T[]) => T;
  protected abstract checkComplexValue?: (
    type: ComplexType,
    value: any
  ) => [true, T] | [false];
  protected abstract mapComplexValue: (
    type: ComplexType,
    value: { [key: string]: T }
  ) => T;
}

export class ResourceOutputValue {
  constructor(
    public item: ErasedDesiredState,
    public valueAccessor: (outputs: PropertyValues<PropertyMap>) => any
  ) {}
}

interface CreatedStateForDesired {
  desiredState: ErasedDesiredState;
  createdState: OutputValues<PropertyMap>;
}

export interface CreatedState {
  [desiredStateName: string]: CreatedStateForDesired;
}

export class RuntimeValue<T> {
  constructor(
    public resourceOutputValues: ResourceOutputValue[],
    public valueAccessor: (createdState: CreatedState) => T
  ) {}

  // TODO: Better serialisation
  public toJSON = (): string => {
    return `<RuntimeValue(${this.resourceOutputValues
      .map((r) => `['${r.item.name}', ${r.valueAccessor.toString()}]`)
      .join(',')})>`;
  };
}

export function isRuntimeValue<T>(
  value: T | RuntimeValue<T>
): value is RuntimeValue<T> {
  return value instanceof RuntimeValue;
}

export type Value<T> = T | RuntimeValue<T>;

export function mapValue<T, R>(
  value: Value<T>,
  mapper: (value: T) => R
): Value<R> {
  if (value instanceof RuntimeValue) {
    return new RuntimeValue<R>(value.resourceOutputValues, (state) =>
      mapper(value.valueAccessor(state))
    );
  }

  return mapper(value);
}

export function mapValues<T extends any[], R>(
  values: { [I in keyof T]: Value<T[I]> },
  mapper: (...values: { [I in keyof T]: T[I] }) => R
): Value<R> {
  if (values.some((v) => v instanceof RuntimeValue)) {
    const resourceOutputValues = Array.from(
      new Set(
        values.flatMap((v) =>
          v instanceof RuntimeValue ? v.resourceOutputValues : []
        )
      )
    );
    return new RuntimeValue<R>(resourceOutputValues, (state) => {
      const inputValues = values.map((val) => {
        if (!(val instanceof RuntimeValue)) {
          return val;
        }

        const subState = val.resourceOutputValues.reduce((acc, outputValue) => {
          acc[outputValue.item.name] = state[outputValue.item.name];
          return acc;
        }, {} as CreatedState);

        return val.valueAccessor(subState);
      }) as { [I in keyof T]: T[I] };
      return mapper(...inputValues);
    });
  }

  const staticValues = values as { [I in keyof T]: T[I] };
  return mapper(...staticValues);
}

export function getRuntimeResourceValue<
  Res extends Resource<PropertyMap, PropertyMap>,
  Prop
>(
  item: DesiredState<Res>,
  valueAccessor: (outputs: ResolvedPropertyValues<Res['outputs']>) => Prop
): RuntimeValue<Prop> {
  return new RuntimeValue(
    [
      new ResourceOutputValue(
        item,
        valueAccessor as (outputs: PropertyValues<any>) => Prop
      ),
    ],
    (state) =>
      valueAccessor(
        state[item.name].createdState as ResolvedPropertyValues<Res['outputs']>
      )
  );
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
  children: ErasedDesiredState[];
}

export function dependentGenerator<Inputs extends PropertyMap, Prop>(
  inputs: Inputs,
  func: (
    values: PropertyValues<Inputs>,
    related: RelatedResources
  ) => Value<Prop> | GenerationResult
): BaseConstraint<Prop> {
  return {
    generateConstrainedValue: func as (
      values: PropertyValues<PropertyMap>,
      related: RelatedResources
    ) => Value<Prop> | GenerationResult,
  };
}

export function generator<Prop>(
  func: () => Prop | GenerationResult
): BaseConstraint<Prop> {
  return {
    generateConstrainedValue: func as (
      values: PropertyValues<PropertyMap>
    ) => Value<Prop> | GenerationResult,
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
