import { FunctionValue, Literal, Signature } from '../ast/expressions';
import {
  func,
  nullType,
  primative,
  Type,
  undefinedType,
} from '../types/expression-types';
import { Context, ContextTypes } from './context';

const dateSignatures: Signature[] = [
  { parameters: [], returnType: primative(Type.Date) },
  {
    parameters: [
      primative(Type.Number), // Year
      primative(Type.Number), // Month
      primative(Type.Number), // Day
    ],
    returnType: primative(Type.Date),
  },
  {
    parameters: [
      primative(Type.Number), // Year
      primative(Type.Number), // Month
      primative(Type.Number), // Day
      primative(Type.Number), // Hour
      primative(Type.Number), // Minute
    ],
    returnType: primative(Type.Date),
  },
  {
    parameters: [
      primative(Type.Number), // Year
      primative(Type.Number), // Month
      primative(Type.Number), // Day
      primative(Type.Number), // Hour
      primative(Type.Number), // Minute
      primative(Type.Number), // Seconds
    ],
    returnType: primative(Type.Date),
  },
];

export const BASE_CONTEXT_TYPES: ContextTypes = {
  undefined: undefinedType,
  null: nullType,
  date: func(dateSignatures),
};

const dateFunc = (...args: number[]) => {
  if (args.length < 1) {
    return new Date();
  } else if (args.length === 3) {
    return new Date(Date.UTC(args[0], args[1] - 1, args[2]));
  } else if (args.length === 5) {
    return new Date(Date.UTC(args[0], args[1] - 1, args[2], args[3], args[4]));
  } else if (args.length === 6) {
    return new Date(
      Date.UTC(args[0], args[1] - 1, args[2], args[3], args[4], args[5])
    );
  } else {
    throw new Error('Invalid date call');
  }
};

export const BASE_CONTEXT: Context = {
  undefined: new Literal(undefined),
  null: new Literal(null),
  date: new FunctionValue(dateFunc, dateSignatures),
};
