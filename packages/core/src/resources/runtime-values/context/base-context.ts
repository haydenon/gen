import { Literal } from '../ast/expressions';
import { undefinedType } from '../types/expression-types';
import { Context, ContextTypes } from './context';

export const BASE_CONTEXT_TYPES: ContextTypes = {
  undefined: undefinedType,
};

export const BASE_CONTEXT: Context = {
  undefined: new Literal(undefined),
  null: new Literal(null),
};
