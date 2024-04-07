import { DesiredState } from '../desired-state';
import { Value } from '../properties/properties';
import {
  Resource,
  PropertyMap,
  OutputValues,
  PropertyValueType,
} from '../resource';
import {
  PropertyPathSegment,
  PropertyPathType,
  getPathFromAccessor,
} from '../utilities/proxy-path';
import { Expr } from './ast/expressions';
import { identifier } from './ast/tokens/token';
import { Context } from './context';
import { evaluate } from './evaluator/evaluator';
import { CREATED_STATE_KEY } from './generator-context';
import { getValueExpr } from './value-mapper';

export class RuntimeValue<T> {
  constructor(public depdendentStateNames: string[], public expression: Expr) {}

  evaluate(context: Context): T {
    return evaluate(this.expression, context);
  }
}

export function isRuntimeValue<T>(
  value: T | RuntimeValue<T>
): value is RuntimeValue<T> {
  const val = value as any;
  return (
    val &&
    val.depdendentStateNames instanceof Array &&
    val.expression !== undefined
  );
}

export function mapValue<T, R>(
  value: Value<T>,
  mapper: (value: T) => R
): Value<R> {
  if (isRuntimeValue(value)) {
    return new RuntimeValue<R>(
      value.depdendentStateNames,
      Expr.Call(Expr.FunctionValue(mapper), [value.expression])
    );
  }

  return mapper(evaluate(getValueExpr(value), {}));
}

export function mapValues<T extends any[], R>(
  values: { [I in keyof T]: Value<T[I]> },
  mapper: (...values: { [I in keyof T]: T[I] }) => R
): Value<R> {
  if (values.some((v) => isRuntimeValue(v))) {
    const resourceOutputValues = Array.from(
      new Set(
        values.flatMap((v) => (isRuntimeValue(v) ? v.depdendentStateNames : []))
      )
    );
    const inputValues: Expr[] = values.map((val) => {
      if (!isRuntimeValue(val)) {
        return getValueExpr(val);
      }

      return val.expression;
    }) as { [I in keyof T]: T[I] };
    return new RuntimeValue<R>(
      resourceOutputValues,
      Expr.Call(Expr.FunctionValue(mapper), inputValues)
    );
  }

  const staticValues = values.map(getValueExpr);
  return mapper(
    ...(staticValues.map((v) => evaluate(v, {})) as { [I in keyof T]: T[I] })
  );
}

export function getRuntimeResourceValue<
  Res extends Resource<PropertyMap, PropertyMap>,
  Key extends keyof OutputValues<Res['outputs']> & keyof Res['outputs']
>(
  item: DesiredState<Res>,
  key: Key
): RuntimeValue<PropertyValueType<Res['outputs'][Key]>> {
  return new RuntimeValue(
    [item.name],
    Expr.GetProp(
      Expr.Variable(identifier(item.name)),
      Expr.Literal(key.toString())
    )
  );
}

type OutputsForResource<T> = T extends Resource<PropertyMap, infer Outputs>
  ? OutputValues<Outputs>
  : never;

export function resolve<Res extends Resource<PropertyMap, PropertyMap>, T>(
  resourceType: Res,
  value: Value<any>,
  accessor: (outputs: OutputsForResource<Res>) => T
): RuntimeValue<T> {
  const idExpr = isRuntimeValue(value) ? value.expression : Expr.Literal(value);
  const dependencies = isRuntimeValue(value) ? value.depdendentStateNames : [];
  const path = getPathFromAccessor(accessor);
  const getProp = (segment: PropertyPathSegment): any =>
    segment.type === PropertyPathType.ArrayIndexAccess
      ? (segment.indexAccess as number)
      : segment.propertyName;

  const createdStateExpr = Expr.GetProp(
    Expr.Variable(identifier(CREATED_STATE_KEY)),
    Expr.Literal(resourceType.name)
  );
  const resourceForIdExpr = Expr.GetProp(createdStateExpr, idExpr);
  let propExpr = Expr.GetProp(
    resourceForIdExpr,
    Expr.Literal(getProp(path[0]))
  );
  for (let i = 1; i < path.length; i++) {
    propExpr = Expr.GetProp(propExpr, Expr.Literal(getProp(path[i])));
  }
  return new RuntimeValue(dependencies, propExpr);
}
