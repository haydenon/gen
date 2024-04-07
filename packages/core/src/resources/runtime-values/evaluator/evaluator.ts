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
  acceptExpr,
} from '../ast/expressions';
import { Context } from '../context';
import { BASE_CONTEXT } from '../context/base-context';

class EvalutorVisitor implements Visitor<any> {
  constructor(private context: Context) {}

  visitLiteralExpr(expr: Literal) {
    return expr.value;
  }

  visitArrayConstructorExpr(expr: ArrayConstructor): any[] {
    return expr.items.map((i) => acceptExpr(this, i));
  }

  visitObjectConstructorExpr(expr: ObjectConstructor): { [key: string]: any } {
    return expr.fields.reduce((acc, [key, value]) => {
      acc[key.lexeme] = acceptExpr(this, value);
      return acc;
    }, {} as { [key: string]: any });
  }

  visitCallExpr(expr: Call): any {
    return acceptExpr(
      this,
      expr.callee
    )(...expr.args.map((a) => acceptExpr(this, a)));
  }

  visitVariableExpr(expr: Variable): any {
    if (expr.name.lexeme in this.context) {
      return acceptExpr(this, this.context[expr.name.lexeme]);
    }

    throw new Error(`No variable '${expr.name.lexeme}'`);
  }

  visitGetExpr(expr: GetProp): any {
    const indexer = acceptExpr(this, expr.indexer);
    return acceptExpr(this, expr.obj)[indexer];
  }

  visitFormatString(expr: FormatString) {
    let string: string = acceptExpr(this, expr.strings[0]).toString();

    for (let i = 0; i < expr.expressions.length; i++) {
      string +=
        acceptExpr(this, expr.expressions[i]).toString() +
        acceptExpr(this, expr.strings[i + 1]).toString();
    }

    return string;
  }

  visitFunctionExpr(expr: FunctionValue) {
    return expr.func;
  }
}

export function evaluate<T>(expression: Expr, context: Context): T {
  const visitor = new EvalutorVisitor({ ...BASE_CONTEXT, ...context });
  return acceptExpr(visitor, expression);
}
