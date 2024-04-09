import {
  ArrayConstructor,
  Call,
  Expr,
  Literal,
  Variable,
} from './ast/expressions';
import { identifier } from './ast/tokens/token';

export const getValueExpr = (value: any): Expr => {
  if (value === undefined) {
    return Expr.Literal(undefined);
  }

  if (value === null) {
    return Expr.Literal(null);
  }

  if (value instanceof Date) {
    const args = [value.getFullYear(), value.getMonth(), value.getDate()];

    const hours = value.getHours();
    if (hours !== 0) {
      args.push(hours);
      args.push(value.getMinutes());

      const seconds = value.getSeconds();
      if (seconds !== 0) {
        args.push(seconds);
        const ms = value.getMilliseconds();
        if (ms !== 0) {
          args.push(ms);
        }
      }
    }

    return Expr.Call(
      Expr.Variable(identifier('date')),
      args.map((a) => Expr.Literal(a))
    );
  }

  const validPrimatives = ['boolean', 'number', 'string'];
  if (validPrimatives.includes(typeof value)) {
    return Expr.Literal(value);
  }

  if (value instanceof Array) {
    return Expr.ArrayConstructor(value.map(getValueExpr));
  }
  if (typeof value === 'object') {
    return Expr.ObjectConstructor(
      Object.keys(value).map((key) => [
        identifier(key),
        getValueExpr(value[key]),
      ])
    );
  }

  throw new Error('Invalid expression: ' + JSON.stringify(value));
};
