import {
  acceptExpr,
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
import { Token } from '../ast/tokens/token';
import { RuntimeValue } from '../runtime-values';

class RuntimeOutputVisitor implements Visitor<string> {
  visitLiteralExpr(expr: Literal): string {
    if (expr === null) {
      return 'null';
    }
    if (expr === undefined) {
      return 'undefined';
    }

    if (typeof expr.value === 'string') {
      return `"${expr.value}"`;
    }

    return expr.value.toString();
  }
  visitArrayConstructorExpr(expr: ArrayConstructor): string {
    return `[${expr.items.map((i) => acceptExpr(this, i)).join(', ')}]`;
  }
  visitObjectConstructorExpr(expr: ObjectConstructor): string {
    const getKey = (key: Token) =>
      /^[a-zA-Z][a-zA-Z]*$/g.test(key.lexeme)
        ? key.lexeme
        : `["${key.lexeme}"]`;
    return `{${expr.fields
      .map(([key, value]) => `${getKey(key)}: ${acceptExpr(this, value)}`)
      .join(', ')}}`;
  }
  visitCallExpr(expr: Call): string {
    const params = expr.args.map((a) => acceptExpr(this, a)).join(', ');
    return `${acceptExpr(this, expr.callee)}(${params})`;
  }
  visitVariableExpr(expr: Variable): string {
    return expr.name.lexeme;
  }
  visitGetExpr(expr: GetProp): string {
    const prop = acceptExpr(this, expr.indexer);
    if (prop.startsWith('"') && prop.endsWith('"')) {
      return `${acceptExpr(this, expr.obj)}.${prop.substring(
        1,
        prop.length - 1
      )}`;
    } else {
      return `${acceptExpr(this, expr.obj)}[${prop}]`;
    }
  }
  visitFormatString(expr: FormatString): string {
    let string = '"' + expr.strings[0];

    for (let i = 0; i < expr.expressions.length; i++) {
      string +=
        `\${${acceptExpr(this, expr.expressions[i]).toString()}}` +
        expr.strings[i + 1];
    }

    string += '"';

    return string;
  }
  visitFunctionExpr(): string {
    return '<function>';
  }
}

const visitor = new RuntimeOutputVisitor();

export function outputExpression(expression: Expr): string {
  return acceptExpr(visitor, expression);
}

export function outputRuntimeValue<T>(value: RuntimeValue<T>): string {
  return outputExpression(value.expression);
}
