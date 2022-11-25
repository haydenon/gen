import { ParentCreationMode, ResolvedInputs } from '..';
import { PropertyMap, PropertyValues, ResourceOrGroupItem } from '../resource';
import { RuntimeValue } from '../runtime-values';
import { IntType, LinkOfType, StringType, Value } from './properties';

export class GenerationResult {
  private constructor(public wasGenerated: boolean) {}
  static ValueNotGenerated = new GenerationResult(true);
}

export interface BaseConstraint<T> {
  isValid?: (value: T) => boolean;
  generateConstrainedValue?: (
    values: PropertyValues<PropertyMap>
  ) => T | RuntimeValue<T> | GenerationResult;
}

export interface IntConstraint extends BaseConstraint<number> {
  min?: number;
  max?: number;
  float?: boolean;
  precision?: number;
}

export interface FloatConstraint extends BaseConstraint<number> {
  min?: number;
  max?: number;
  precision?: number;
}

export interface DateConstraint extends BaseConstraint<Date> {
  minDate?: Date;
  maxDate?: Date;
}

export interface StringConstraint extends BaseConstraint<string> {
  minLength?: number;
  maxLength?: number;
}

export interface ArrayConstraint<T> extends BaseConstraint<T[]> {
  minItems?: number;
  maxItems?: number;
}

export type StringOrIntLink<
  Res extends ResourceOrGroupItem<PropertyMap, PropertyMap>
> = LinkOfType<Res, StringType, true> | LinkOfType<Res, IntType, true>;
export type UndefinableStringOrIntLink<
  Res extends ResourceOrGroupItem<PropertyMap, PropertyMap>
> = LinkOfType<Res, StringType, false> | LinkOfType<Res, IntType, false>;

export interface ParentConstraints<
  T extends ResourceOrGroupItem<PropertyMap, PropertyMap>
> {
  setValue<V>(
    accessor: (parentInputs: ResolvedInputs<T['inputs']>) => V,
    value: Value<V>
  ): void;
  ancestor<Ancestor extends ResourceOrGroupItem<PropertyMap, PropertyMap>>(
    accessor: (parentInputs: ResolvedInputs<T['inputs']>) => string | number
  ): ParentConstraints<Ancestor>;
  ancestor<Ancestor extends ResourceOrGroupItem<PropertyMap, PropertyMap>>(
    accessor: (
      parentInputs: ResolvedInputs<T['inputs']>
    ) => (string | undefined) | (number | undefined),
    creationMode: ParentCreationMode
  ): ParentConstraints<Ancestor>;
}

export interface LinkConstraint<
  Res extends ResourceOrGroupItem<PropertyMap, PropertyMap>
> extends BaseConstraint<any> {
  parentConstraint?: (
    constraints: ParentConstraints<Res>,
    childValues: PropertyValues<PropertyMap>
  ) => void;
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

export function dependentGenerator<Inputs extends PropertyMap, Prop>(
  inputs: Inputs,
  func: (values: PropertyValues<Inputs>) => Value<Prop> | GenerationResult
): BaseConstraint<Prop> {
  return {
    generateConstrainedValue: func as (
      values: PropertyValues<PropertyMap>
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

export function parentConstraint<
  Inputs extends PropertyMap,
  Parent extends ResourceOrGroupItem<PropertyMap, PropertyMap>
>(
  inputs: Inputs,
  parent: Parent,
  func: (
    constraints: ParentConstraints<Parent>,
    childValues: PropertyValues<Inputs>
  ) => void
): LinkConstraint<Parent> {
  return {
    parentConstraint: func as (
      constraints: ParentConstraints<Parent>,
      childValues: PropertyValues<PropertyMap>
    ) => void,
  };
}
