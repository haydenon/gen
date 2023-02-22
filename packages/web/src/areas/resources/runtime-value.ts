import { Call, Expr, identifier, Variable } from '@haydenon/gen-core';

export class FormRuntimeValue {
  constructor(public textInput: string | undefined, public expression: Expr) {}
}

export const WELL_KNOWN_RUNTIME_VALUES = {
  undefined: new FormRuntimeValue(
    undefined,
    new Variable(identifier('undefined'))
  ),
  minDate: new FormRuntimeValue(
    undefined,
    new Call(new Variable(identifier('date')), [])
  ),
};
