import { Expr } from '@haydenon/gen-core';

export class FormRuntimeValue {
  constructor(public textInput: string | undefined, public expression: Expr) {}
}
