import type { Expr, Literal, Variable, GetProp, Call, ObjectConstructor, ArrayConstructor, FormatString, FunctionValue } from './ast/expressions';
import { Expr as ExprUtils } from './ast/expressions';
import type { Token } from './ast/tokens/token';

/**
 * Compare two tokens for structural equality
 */
function tokenEquals(a: Token, b: Token): boolean {
  return a.type === b.type && a.lexeme === b.lexeme && a.literal === b.literal;
}

/**
 * Compare two expressions for structural equality
 */
export function exprEquals(a: Expr, b: Expr): boolean {
  // Different types are never equal
  if (a.type !== b.type) {
    return false;
  }

  // Check each expression type
  if (ExprUtils.isLiteral(a) && ExprUtils.isLiteral(b)) {
    return literalEquals(a, b);
  }

  if (ExprUtils.isVariable(a) && ExprUtils.isVariable(b)) {
    return variableEquals(a, b);
  }

  if (ExprUtils.isGetProp(a) && ExprUtils.isGetProp(b)) {
    return getPropEquals(a, b);
  }

  if (ExprUtils.isCall(a) && ExprUtils.isCall(b)) {
    return callEquals(a, b);
  }

  if (ExprUtils.isArrayConstructor(a) && ExprUtils.isArrayConstructor(b)) {
    return arrayConstructorEquals(a, b);
  }

  if (ExprUtils.isObjectConstructor(a) && ExprUtils.isObjectConstructor(b)) {
    return objectConstructorEquals(a, b);
  }

  if (ExprUtils.isFormatString(a) && ExprUtils.isFormatString(b)) {
    return formatStringEquals(a, b);
  }

  if (ExprUtils.isFunctionValue(a) && ExprUtils.isFunctionValue(b)) {
    return functionValueEquals(a, b);
  }

  return false;
}

function literalEquals(a: Literal, b: Literal): boolean {
  // Handle special cases
  if (a.value === b.value) {
    return true;
  }

  // Handle NaN
  if (typeof a.value === 'number' && typeof b.value === 'number') {
    return Number.isNaN(a.value) && Number.isNaN(b.value);
  }

  // Handle Date objects
  if (a.value instanceof Date && b.value instanceof Date) {
    return a.value.getTime() === b.value.getTime();
  }

  // Arrays and objects need deep comparison
  if (typeof a.value === 'object' && typeof b.value === 'object') {
    return JSON.stringify(a.value) === JSON.stringify(b.value);
  }

  return false;
}

function variableEquals(a: Variable, b: Variable): boolean {
  return tokenEquals(a.name, b.name);
}

function getPropEquals(a: GetProp, b: GetProp): boolean {
  return exprEquals(a.obj, b.obj) && exprEquals(a.indexer, b.indexer);
}

function callEquals(a: Call, b: Call): boolean {
  if (!exprEquals(a.callee, b.callee)) {
    return false;
  }

  if (a.args.length !== b.args.length) {
    return false;
  }

  return a.args.every((arg, i) => exprEquals(arg, b.args[i]));
}

function arrayConstructorEquals(a: ArrayConstructor, b: ArrayConstructor): boolean {
  if (a.items.length !== b.items.length) {
    return false;
  }

  return a.items.every((item, i) => exprEquals(item, b.items[i]));
}

function objectConstructorEquals(a: ObjectConstructor, b: ObjectConstructor): boolean {
  if (a.fields.length !== b.fields.length) {
    return false;
  }

  return a.fields.every(([aToken, aExpr], i) => {
    const [bToken, bExpr] = b.fields[i];
    return tokenEquals(aToken, bToken) && exprEquals(aExpr, bExpr);
  });
}

function formatStringEquals(a: FormatString, b: FormatString): boolean {
  if (a.strings.length !== b.strings.length || a.expressions.length !== b.expressions.length) {
    return false;
  }

  const stringsEqual = a.strings.every((str, i) => literalEquals(str, b.strings[i]));
  const expressionsEqual = a.expressions.every((expr, i) => exprEquals(expr, b.expressions[i]));

  return stringsEqual && expressionsEqual;
}

function functionValueEquals(a: FunctionValue, b: FunctionValue): boolean {
  // Functions are compared by reference since we can't compare function bodies
  return a.func === b.func;
}
