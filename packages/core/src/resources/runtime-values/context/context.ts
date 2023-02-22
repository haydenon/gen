import { Expr } from '../ast/expressions';
import { ExprType } from '../types';

export interface ContextTypes {
  [name: string]: ExprType;
}

export interface Context {
  [name: string]: Expr;
}
