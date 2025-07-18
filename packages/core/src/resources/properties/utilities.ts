import { getPathFromAccessor, PropertyPathType } from '../utilities/proxy-path';
import { Value } from './properties';

export const CHECKING_PROVISION = '__CHECKING_PROVISION';

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
  const result = valueMap[fieldName];
  valueMap[CHECKING_PROVISION] = false;

  return result as boolean;
}
