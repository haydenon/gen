import { Expr, identifier } from '@haydenon/gen-core';

export interface FormRuntimeValue {
  textInput: string | undefined;
  expression: Expr;
  dependentResourceIds: string[];
}

export const createFormRuntimeValue = (
  textInput: string | undefined,
  expression: Expr,
  dependentResourceIds: string[]
): FormRuntimeValue => ({
  textInput,
  expression,
  dependentResourceIds,
});

export const isFormRuntimeValue = (value: any): value is FormRuntimeValue =>
  value && value.expression && value.dependentResourceIds;

export const WELL_KNOWN_RUNTIME_VALUES = {
  undefined: createFormRuntimeValue(
    undefined,
    Expr.Variable(identifier('undefined')),
    []
  ),
  minDate: createFormRuntimeValue(
    undefined,
    Expr.Call(Expr.Variable(identifier('date')), [
      Expr.Literal(1970),
      Expr.Literal(0),
      Expr.Literal(1),
    ]),
    []
  ),
};
