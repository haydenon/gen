import {
  Literal,
  Expr,
  FormatString,
} from '@haydenon/gen-core/src/resources/runtime-values/ast/expressions';

import { RuntimeValue } from '@haydenon/gen-core/src/resources/runtime-values';

function replaceStringRuntimeTemplates(
  value: string,
  parse: (expr: string) => RuntimeValue<any> | Error
): (string | RuntimeValue<any>) | Error {
  const expressions: string[] = [];
  const strs: string[] = [];
  let start = 0;
  let expressionDepth = 0;
  const matchesNext = (pos: number, toMatch: string): boolean =>
    pos + 1 < value.length && value[pos + 1] === toMatch;
  const isAtOpen = (pos: number): boolean =>
    value[pos] === '$' && matchesNext(pos, '{');
  for (let i = 0; i < value.length; i++) {
    if (expressionDepth === 0) {
      if (isAtOpen(i)) {
        strs.push(value.substring(start, i));
        expressionDepth++;
        start = i + 2;
        i++;
      } else if (
        value[i] === '$' &&
        matchesNext(i, '$') &&
        matchesNext(i + 1, '{')
      ) {
        // Escaped dollar sign
        i += 2;
      }
    } else {
      if (isAtOpen(i)) {
        // Any nested expression openings are invalid expression string formats.
        return new Error('Invalid expression string');
      } else if (value[i] === '}') {
        expressions.push(value.substring(start, i));
        start = i + 1;
        expressionDepth--;
      }
    }
  }

  if (expressionDepth > 0) {
    return new Error('Invalid expression string');
  }

  strs.push(value.substring(start, value.length));

  if (expressions.length > 0) {
    if (expressions.length === 1 && strs[0] === '' && strs[1] === '') {
      return parse(expressions[0]);
    }

    const parsed = expressions.map((e) => parse(e));
    const error = parsed.find((e) => e instanceof Error) as Error;
    if (error) {
      return error;
    }
    const [desired, exprs] = (parsed as RuntimeValue<any>[]).reduce(
      ([desired, exprs], runtime) => {
        const newStates = runtime.depdendentStateNames.filter((rd) =>
          desired.every((d) => d !== rd)
        );
        return [
          [...desired, ...newStates],
          [...exprs, runtime.expression],
        ];
      },
      [[], []] as [string[], Expr[]]
    );
    return new RuntimeValue(
      desired,
      Expr.FormatString(
        strs.map((str) => Expr.Literal(str.replace(/\$\$\{/g, '${'))),
        exprs
      )
    );
  }

  return value.replace(/\$\$\{/g, '${');
}

export function replaceRuntimeValueTemplates(
  value: unknown,
  parse: (expr: string) => RuntimeValue<any> | Error
): [unknown, Error[]] {
  if (value === undefined) {
    return [undefined, []];
  } else if (value === null) {
    return [null, []];
  }

  if (typeof value === 'string') {
    const resp = replaceStringRuntimeTemplates(value, parse);
    if (resp instanceof Error) {
      return [value, [resp]];
    }

    return [resp, []];
  }

  if (value instanceof Date) {
    return [value, []];
  }

  if (value instanceof Array) {
    return value.reduce(
      ([values, errors], val) => {
        const [newVal, newErrors] = replaceRuntimeValueTemplates(val, parse);
        return [
          [...values, newVal],
          [...errors, ...newErrors],
        ];
      },
      [[], []] as [unknown[], Error[]]
    );
  }

  if (typeof value === 'object') {
    return Object.keys(value).reduce(
      ([acc, errors], field) => {
        const [fieldVal, newErrors] = replaceRuntimeValueTemplates(
          (value as any)[field],
          parse
        );
        acc[field] = fieldVal;
        return [acc, [...errors, ...newErrors]];
      },
      [{}, []] as [{ [field: string]: unknown }, Error[]]
    );
  }

  return [value, []];
}
