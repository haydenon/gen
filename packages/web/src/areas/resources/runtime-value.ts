import { Call, Expr, identifier, Literal, Variable } from '@haydenon/gen-core';

export class FormRuntimeValue {
  constructor(
    public textInput: string | undefined,
    public expression: Expr,
    public dependentResourceIds: string[]
  ) {}
}

export const WELL_KNOWN_RUNTIME_VALUES = {
  undefined: new FormRuntimeValue(
    undefined,
    Expr.Variable(identifier('undefined')),
    []
  ),
  minDate: new FormRuntimeValue(
    undefined,
    Expr.Call(Expr.Variable(identifier('date')), [
      Expr.Literal(1970),
      Expr.Literal(0),
      Expr.Literal(1),
    ]),
    []
  ),
};
