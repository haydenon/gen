import { Signature } from '../ast/expressions';
import { ExprType, Type } from './expression-types';

const lowercaseNames: Type[] = [
  Type.Any,
  Type.Unknown,
  Type.Undefined,
  Type.Null,
  Type.Boolean,
  Type.Number,
  Type.String,
];

const capitalisedNames: Type[] = [Type.Date];

export function outputExprType(type: ExprType): string {
  if (lowercaseNames.includes(type.type)) {
    return type.type.toLowerCase();
  } else if (capitalisedNames.includes(type.type)) {
    return type.type;
  }

  if (type.type === Type.Array) {
    return `${outputExprType(type.inner)}[]`;
  }

  if (type.type === Type.Object) {
    const fieldOutput = (key: string): string =>
      `${key}: ${outputExprType(type.fields[key])}`;
    const objectKeys = Object.keys(type.fields);
    return objectKeys.length > 0
      ? `{ ${objectKeys.map(fieldOutput).join(', ')} }`
      : '{}';
  }

  if (type.type === Type.Union) {
    const types: ExprType[] = [];
    if (type.inner) types.push(type.inner);
    if (type.null) types.push(type.null);
    if (type.undefined) types.push(type.undefined);

    return types.map(outputExprType).join(' | ');
  }

  if (type.type === Type.Function) {
    if (!type.signatures) {
      return '(...any[]) => any';
    }

    const outputFunctionForSignature = (sig: Signature): string => {
      const params = sig.parameters.map(outputExprType).join(', ');
      return `(${params}) => ${outputExprType(sig.returnType)}`;
    };

    return type.signatures.map(outputFunctionForSignature).join(' | ');
  }

  throw new Error('Invalid expression type');
}
