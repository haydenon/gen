import {
  ArrayConstructor,
  Call,
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
    return `[${expr.items.map((i) => i.accept(this)).join(', ')}]`;
  }
  visitObjectConstructorExpr(expr: ObjectConstructor): string {
    const getKey = (key: Token) =>
      /^[a-zA-Z][a-zA-Z]*$/g.test(key.lexeme)
        ? key.lexeme
        : `["${key.lexeme}"]`;
    return `{${expr.fields
      .map(([key, value]) => `${getKey(key)}: ${value.accept(this)}`)
      .join(', ')}}`;
  }
  visitCallExpr(expr: Call): string {
    const params = expr.args.map((a) => a.accept(this)).join(', ');
    return `${expr.callee.accept(this)}(${params})`;
  }
  visitVariableExpr(expr: Variable): string {
    return expr.name.lexeme;
  }
  visitGetExpr(expr: GetProp): string {
    return `${expr.obj.accept(this)}.${expr.name.lexeme}`;
  }
  visitFormatString(expr: FormatString): string {
    let string = '"' + expr.strings[0];

    for (let i = 0; i < expr.expressions.length; i++) {
      string +=
        `\${${expr.expressions[i].accept(this).toString()}}` +
        expr.strings[i + 1];
    }

    string += '"';

    return string;
  }
  visitAnonFuncExpr(): string {
    return '<function>';
  }
}

const visitor = new RuntimeOutputVisitor();

export function outputRuntimeValue<T>(value: RuntimeValue<T>): string {
  return value.expression.accept(visitor);
}
