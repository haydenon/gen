import { getPathFromAccessor, PropertyPathType } from '../utilities/proxy-path';
import { Value } from './properties';

export const CHECKING_PROVISION = Symbol('__CHECKING_PROVISION');

export function isProvided<Values, T>(
  values: Values,
  valueAccessor: (values: Values) => Value<T>
): boolean {
  const path = getPathFromAccessor(valueAccessor);
  if (path.length != 1) {
    throw new Error('Expected access of direct property of inputs');
  }
  const segment = path[0];
  let fieldName: string;
  switch (segment.type) {
    case PropertyPathType.ArrayIndexAccess:
      throw new Error('Expected access of direct property of inputs');
    default:
      fieldName = segment.propertyName;
  }

  const valueMap = values as any;

  valueMap[CHECKING_PROVISION] = true;
  console.log('Checking for ' + fieldName);
  console.log((valueMap as any)[CHECKING_PROVISION]);
  console.log(CHECKING_PROVISION in valueMap);
  const result = valueMap[fieldName];
  valueMap[CHECKING_PROVISION] = false;

  console.log('Result: ' + result);
  return result as boolean;
}
