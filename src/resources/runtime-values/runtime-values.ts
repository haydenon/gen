import { ErasedDesiredState } from '../desired-state';
import { CreatedState } from '../properties/properties';
import { Expr } from './ast/expressions';
import { evaluate } from './evaluator/evaluator';

export class RuntimeValue<T> {
  constructor(
    public resourceOutputValues: ErasedDesiredState[],
    public expression: Expr
  ) {}

  evaluate(createdState: CreatedState): T {
    return evaluate(this.expression, createdState);
  }
}

export function isRuntimeValue<T>(
  value: T | RuntimeValue<T>
): value is RuntimeValue<T> {
  return value instanceof RuntimeValue;
}
