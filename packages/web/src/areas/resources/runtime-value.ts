import { Expr, identifier, exprEquals } from '@haydenon/gen-core';

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

/**
 * Compare two FormRuntimeValues for structural equality
 */
export const formRuntimeValueEquals = (
  a: FormRuntimeValue,
  b: FormRuntimeValue
): boolean => {
  // Compare expressions
  if (!exprEquals(a.expression, b.expression)) {
    return false;
  }

  // Compare text inputs (both should be same or both undefined)
  if (a.textInput !== b.textInput) {
    return false;
  }

  // Compare dependent resource IDs arrays
  if (a.dependentResourceIds.length !== b.dependentResourceIds.length) {
    return false;
  }

  // Check all dependent resource IDs match (order matters)
  return a.dependentResourceIds.every((id, i) => id === b.dependentResourceIds[i]);
};

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
