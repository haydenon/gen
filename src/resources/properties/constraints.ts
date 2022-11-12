import { ErasedDesiredState } from '../desired-state';
import { PropertyMap, PropertyValues } from '../resource';
import { RuntimeValue } from '../runtime-values';
import { Value } from './properties';

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

export interface ArrayConstraint<T> extends BaseConstraint<T> {
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
