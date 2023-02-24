import { CreatedState } from '../../properties/properties';
import {
  FunctionValue,
  ArrayConstructor,
  Call,
  Expr,
  FormatString,
  GetProp,
  Literal,
  ObjectConstructor,
  Variable,
  Visitor,
} from '../ast/expressions';
import { Context } from '../context';
import { BASE_CONTEXT } from '../context/base-context';

class EvalutorVisitor implements Visitor<any> {
  constructor(private createdState: CreatedState, private context: Context) {}

  visitLiteralExpr(expr: Literal) {
    return expr.value;
  }

  visitArrayConstructorExpr(expr: ArrayConstructor): any[] {
    return expr.items.map((i) => i.accept(this));
  }

  visitObjectConstructorExpr(expr: ObjectConstructor): { [key: string]: any } {
    return expr.fields.reduce((acc, [key, value]) => {
      acc[key.lexeme] = value.accept(this);
      return acc;
    }, {} as { [key: string]: any });
  }

  visitCallExpr(expr: Call): any {
    return expr.callee.accept(this)(...expr.args.map((a) => a.accept(this)));
  }

  visitVariableExpr(expr: Variable): any {
    if (expr.name.lexeme in this.context) {
      return this.context[expr.name.lexeme].accept(this);
    }

    return this.createdState[expr.name.lexeme].createdState;
  }

  visitGetExpr(expr: GetProp): any {
    const indexer = expr.indexer.accept(this);
    return expr.obj.accept(this)[indexer];
  }

  visitFormatString(expr: FormatString) {
    let string: string = expr.strings[0].accept(this).toString();

    for (let i = 0; i < expr.expressions.length; i++) {
      string +=
        expr.expressions[i].accept(this).toString() +
        expr.strings[i + 1].accept(this).toString();
    }

    return string;
  }

  visitFunctionExpr(expr: FunctionValue) {
    return expr.func;
  }
}

export function evaluate<T>(expression: Expr, createdState: CreatedState): T {
  const visitor = new EvalutorVisitor(createdState, BASE_CONTEXT);
  return expression.accept(visitor);
}
