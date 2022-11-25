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

export abstract class Expr {
  abstract accept: <R>(visitor: Visitor<R>) => R;
}

export class Variable extends Expr {
  constructor(public name: Token) {
    super();
  }
  accept = <R>(visitor: Visitor<R>) => visitor.visitVariableExpr(this);
}

export class GetProp extends Expr {
  constructor(public obj: Expr, public indexer: Expr) {
    super();
  }
  accept = <R>(visitor: Visitor<R>) => visitor.visitGetExpr(this);
}

export class Literal extends Expr {
  constructor(public value: any) {
    super();
  }
  accept = <R>(visitor: Visitor<R>) => visitor.visitLiteralExpr(this);
}

export class ArrayConstructor extends Expr {
  constructor(public items: Expr[]) {
    super();
  }
  accept = <R>(visitor: Visitor<R>) => visitor.visitArrayConstructorExpr(this);
}

export class ObjectConstructor extends Expr {
  constructor(public fields: [Token, Expr][]) {
    super();
  }
  accept = <R>(visitor: Visitor<R>) => visitor.visitObjectConstructorExpr(this);
}

export class Call extends Expr {
  constructor(public callee: Expr, public args: Expr[]) {
    super();
  }
  accept = <R>(visitor: Visitor<R>) => visitor.visitCallExpr(this);
}

export class FormatString extends Expr {
  constructor(public strings: Literal[], public expressions: Expr[]) {
    super();
  }
  accept = <R>(visitor: Visitor<R>) => visitor.visitFormatString(this);
}

export interface Signature {
  parameters: ExprType[];
  returnType: ExprType;
}

export class FunctionValue extends Expr {
  constructor(
    public func: (...args: any[]) => any,
    public signatures?: Signature[]
  ) {
    super();
  }
  accept = <R>(visitor: Visitor<R>) => visitor.visitFunctionExpr(this);
}
