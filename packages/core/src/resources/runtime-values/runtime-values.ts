import { DesiredState } from '../desired-state';
import { CreatedState, Value } from '../properties/properties';
import {
  Resource,
  PropertyMap,
  OutputValues,
  PropertyValueType,
} from '../resource';
import {
  FunctionValue,
  Call,
  Expr,
  GetProp,
  Variable,
  Literal,
} from './ast/expressions';
import { identifier } from './ast/tokens/token';
import { evaluate } from './evaluator/evaluator';
import { getValueExpr } from './value-mapper';

export class RuntimeValue<T> {
  constructor(public depdendentStateNames: string[], public expression: Expr) {}

  evaluate(createdState: CreatedState): T {
    return evaluate(this.expression, createdState);
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
      new Call(new FunctionValue(mapper), [value.expression])
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
      new Call(new FunctionValue(mapper), inputValues)
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
    new GetProp(
      new Variable(identifier(item.name)),
      new Literal(key.toString())
    )
  );
}
