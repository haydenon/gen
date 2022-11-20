import { ErasedDesiredState } from './desired-state';
import { Value } from './properties';
import { ParentCreationMode } from './properties/links';

interface BaseConstraint {
  path: PropertyPathSegment[];
  value?: Value<any>;
  mode: ParentCreationMode;
  ancestorConstraints?: BaseConstraint[];
}

interface BasicStateConstraint extends BaseConstraint {
  value: Value<any>;
}

interface AncestorStateConstraint extends BaseConstraint {
  ancestorConstraints: StateConstraint[];
}

export type StateConstraint = BasicStateConstraint | AncestorStateConstraint;

export interface StateAndConstraints {
  state: ErasedDesiredState;
  constraints: StateConstraint[];
}

enum PropertyPathType {
  PropertyAccess,
  ArrayIndexAccess,
}
interface PropertyAccess {
  type: PropertyPathType.PropertyAccess;
  propertyName: string;
}
export const propAccess = (prop: string | symbol): PropertyAccess => ({
  type: PropertyPathType.PropertyAccess,
  propertyName: prop.toString(),
});
interface ArrayIndexAccess {
  type: PropertyPathType.ArrayIndexAccess;
  indexAccess: number | 'all';
}
export const arrayIndexAccess = (
  indexAccess: number | 'all'
): ArrayIndexAccess => ({
  type: PropertyPathType.ArrayIndexAccess,
  indexAccess,
});
export type PropertyPathSegment = PropertyAccess | ArrayIndexAccess;

export const pathMatches = (
  p1: PropertyPathSegment[],
  p2: PropertyPathSegment[]
): boolean => {
  if (p1.length !== p2.length) {
    return false;
  }
  if (p1.length === 0) {
    return true;
  }

  const [next1, ...rest1] = p1;
  const [next2, ...rest2] = p2;

  if (
    next1.type === PropertyPathType.ArrayIndexAccess &&
    next2.type === PropertyPathType.ArrayIndexAccess
  ) {
    if (
      next1.indexAccess === 'all' ||
      next2.indexAccess === 'all' ||
      next1.indexAccess === next2.indexAccess
    ) {
      return pathMatches(rest1, rest2);
    } else {
      return false;
    }
  }

  if (
    next1.type === PropertyPathType.PropertyAccess &&
    next2.type === PropertyPathType.PropertyAccess
  ) {
    if (next1.propertyName === next2.propertyName) {
      return pathMatches(rest1, rest2);
    } else {
      return false;
    }
  }

  return false;
};
