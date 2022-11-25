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
    return new Literal(undefined);
  }

  if (value === null) {
    return new Literal(null);
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

    return new Call(
      new Variable(identifier('date')),
      args.map((a) => new Literal(a))
    );
  }

  const validPrimatives = ['boolean', 'number', 'string'];
  if (validPrimatives.includes(typeof value)) {
    return new Literal(value);
  }

  if (value instanceof Array) {
    return new ArrayConstructor(value.map(getValueExpr));
  }
  if (typeof value === 'object') {
    return new ArrayConstructor(value.map(getValueExpr));
  }

  throw new Error('Invalid expression');
};
