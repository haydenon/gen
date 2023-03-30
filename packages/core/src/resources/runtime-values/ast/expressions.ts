import { ExprType } from '../types/expression-types';
import { Token } from './tokens/token';

export interface Visitor<R> {
  // visitBinaryExpr(expr: Binary): R;
  // visitUnaryExpr(expr: Unary): R;
  visitLiteralExpr(expr: Literal): R;
  // visitLogicalExpr(expr: Logical): R;
  // visitGroupingExpr(expr: Grouping): R;
  visitArrayConstructorExpr(expr: ArrayConstructor): R;
  visitObjectConstructorExpr(expr: ObjectConstructor): R;
  // visitTernaryExpr(expr: Ternary): R;
  visitVariableExpr(expr: Variable): R;
  visitCallExpr(expr: Call): R;
  visitGetExpr(expr: GetProp): R;
  visitFormatString(expr: FormatString): R;
  visitFunctionExpr(expr: FunctionValue): R;
}

enum Type {
  Literal = 'Literal',
  ArrayConstructor = 'ArrayConstructor',
  ObjectConstructor = 'ObjectConstructor',
  Variable = 'Variable',
  Call = 'Call',
  GetProp = 'GetProp',
  FormatString = 'FormatString',
  Function = 'Function',
}

export function acceptExpr<R>(visitor: Visitor<R>, expr: Expr): R {
  switch (expr.type) {
    case Type.Literal:
      return visitor.visitLiteralExpr(expr);
    case Type.ArrayConstructor:
      return visitor.visitArrayConstructorExpr(expr);
    case Type.ObjectConstructor:
      return visitor.visitObjectConstructorExpr(expr);
    case Type.Variable:
      return visitor.visitVariableExpr(expr);
    case Type.Call:
      return visitor.visitCallExpr(expr);
    case Type.GetProp:
      return visitor.visitGetExpr(expr);
    case Type.FormatString:
      return visitor.visitFormatString(expr);
    case Type.Function:
      return visitor.visitFunctionExpr(expr);
  }
}

interface ExprBase {
  type: Type;
}

export const Expr = {
  Variable: (name: Token): Variable => ({
    type: Type.Variable,
    name,
  }),
  isVariable: (expr: Expr): expr is Variable => expr.type === Type.Variable,
  GetProp: (obj: Expr, indexer: Expr): GetProp => ({
    type: Type.GetProp,
    obj,
    indexer,
  }),
  isGetProp: (expr: Expr): expr is GetProp => expr.type === Type.GetProp,
  Literal: (value: any): Literal => ({
    type: Type.Literal,
    value,
  }),
  isLiteral: (expr: Expr): expr is Literal => expr.type === Type.Literal,
  ArrayConstructor: (items: Expr[]): ArrayConstructor => ({
    type: Type.ArrayConstructor,
    items,
  }),
  isArrayConstructor: (expr: Expr): expr is ArrayConstructor =>
    expr.type === Type.ArrayConstructor,
  ObjectConstructor: (fields: [Token, Expr][]): ObjectConstructor => ({
    type: Type.ObjectConstructor,
    fields,
  }),
  isObjectConstructor: (expr: Expr): expr is ObjectConstructor =>
    expr.type === Type.ObjectConstructor,
  Call: (callee: Expr, args: Expr[]): Call => ({
    type: Type.Call,
    callee,
    args,
  }),
  isCall: (expr: Expr): expr is Call => expr.type === Type.Call,
  FormatString: (strings: Literal[], expressions: Expr[]): FormatString => ({
    type: Type.FormatString,
    strings,
    expressions,
  }),
  isFormatString: (expr: Expr): expr is FormatString =>
    expr.type === Type.FormatString,
  FunctionValue: (
    func: (...args: any[]) => any,
    signatures?: Signature[]
  ): FunctionValue => ({
    type: Type.Function,
    func,
    signatures,
  }),
  isFunctionValue: (expr: Expr): expr is FunctionValue =>
    expr.type === Type.Function,
};

export type Expr =
  | Literal
  | ArrayConstructor
  | ObjectConstructor
  | Variable
  | Call
  | GetProp
  | FormatString
  | FunctionValue;

export interface Variable extends ExprBase {
  type: Type.Variable;
  name: Token;
}

export interface GetProp extends ExprBase {
  type: Type.GetProp;
  obj: Expr;
  indexer: Expr;
}

export interface Literal extends ExprBase {
  type: Type.Literal;
  value: any;
}

export interface ArrayConstructor extends ExprBase {
  type: Type.ArrayConstructor;
  items: Expr[];
}

export interface ObjectConstructor extends ExprBase {
  type: Type.ObjectConstructor;
  fields: [Token, Expr][];
}

export interface Call extends ExprBase {
  type: Type.Call;
  callee: Expr;
  args: Expr[];
}

export interface FormatString extends ExprBase {
  type: Type.FormatString;
  strings: Literal[];
  expressions: Expr[];
}

export interface Signature {
  parameters: ExprType[];
  returnType: ExprType;
}

export interface FunctionValue extends ExprBase {
  type: Type.Function;
  func: (...args: any[]) => any;
  signatures?: Signature[];
}
