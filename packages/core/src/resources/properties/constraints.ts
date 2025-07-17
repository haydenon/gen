import { ParentCreationMode, ResolvedValues } from '..';
import { PropertyMap, PropertyValues, ResourceOrGroupItem } from '../resource';
import { RuntimeValue } from '../runtime-values';
import { getPathFromAccessor, PropertyPathType } from '../utilities/proxy-path';
import { IntType, LinkOfType, StringType, Value } from './properties';

export class GenerationResult {
  private constructor(public wasGenerated: boolean) {}
  static ValueNotGenerated = new GenerationResult(true);
}

type Limit<T> = T | { prefer: T; actual: T };
type NumLimit = Limit<number>;

const hasPreference = <T>(limit: Limit<T>): limit is { prefer: T; actual: T } =>
  (limit as any).prefer;
export function getGenerationLimitValue<T>(limit: Limit<T>): T;
export function getGenerationLimitValue<T>(
  limit: Limit<T> | undefined
): T | undefined {
  if (limit === undefined) {
    return undefined;
  }
  return hasPreference(limit) ? limit.prefer : limit;
}
export function getValidationLimitValue<T>(limit: Limit<T>): T;
export function getValidationLimitValue<T>(
  limit: Limit<T> | undefined
): T | undefined {
  if (limit === undefined) {
    return undefined;
  }

  return hasPreference(limit) ? limit.actual : limit;
}

export interface BaseConstraint<T> {
  validValues?: T[];
  isValid?: (value: T) => boolean;
  generateConstrainedValue?: (
    values: PropertyValues<PropertyMap>
  ) => T | RuntimeValue<T> | GenerationResult;
}

export interface IntConstraint extends BaseConstraint<number> {
  min?: NumLimit;
  max?: NumLimit;
  float?: boolean;
  precision?: number;
}

export interface FloatConstraint extends BaseConstraint<number> {
  min?: NumLimit;
  max?: NumLimit;
  precision?: number;
}

export interface DateConstraint extends BaseConstraint<Date> {
  minDate?: Limit<Date>;
  maxDate?: Limit<Date>;
}

export interface StringConstraint extends BaseConstraint<string> {
  minLength?: NumLimit;
  maxLength?: NumLimit;
}

export interface ArrayConstraint<T> extends BaseConstraint<T[]> {
  minItems?: NumLimit;
  maxItems?: NumLimit;
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
    accessor: (parentInputs: ResolvedValues<T['inputs']>) => V,
    value: Value<V> | ((val: Value<V>) => Value<V>)
  ): void;
  ancestor<Ancestor extends ResourceOrGroupItem<PropertyMap, PropertyMap>>(
    accessor: (parentInputs: ResolvedValues<T['inputs']>) => string | number
  ): ParentConstraints<Ancestor>;
  ancestor<Ancestor extends ResourceOrGroupItem<PropertyMap, PropertyMap>>(
    accessor: (
      parentInputs: ResolvedValues<T['inputs']>
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

// export function ifProvided<Inputs extends PropertyMap, Prop>(
//   inputs: Inputs,
//   func: (values: PropertyValues<Inputs>) => Value<Prop> | GenerationResult
// ): BaseConstraint<Prop> {
//   return {
//     generateConstrainedValue: func as (
//       values: PropertyValues<PropertyMap>
//     ) => Value<Prop> | GenerationResult,
//   };
// }

export const CHECKING_PROVISION = Symbol('__CHECKING_PROVISION');

export function isProvided<Values, T>(
  values: Values,
  valueAccessor: (values: Values) => Value<T>
): boolean {
  const path = getPathFromAccessor(valueAccessor);
  if (path.length != 1) {
    throw new Error('Expected access of direct property of inputs');
  }
  const segment = path[0];
  let fieldName: string;
  switch (segment.type) {
    case PropertyPathType.ArrayIndexAccess:
      throw new Error('Expected access of direct property of inputs');
    default:
      fieldName = segment.propertyName;
  }

  const valueMap = values as any;

  valueMap[CHECKING_PROVISION] = true;
  const result = valueMap[fieldName];
  valueMap[CHECKING_PROVISION] = false;

  return result as boolean;
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
