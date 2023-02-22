import { ExprType } from '../types';

export interface Context {
  [name: string]: ExprType;
}
