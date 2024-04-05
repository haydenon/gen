import { ErasedDesiredState } from './desired-state';
import type { Value } from './properties/properties';
import { ParentCreationMode } from './properties/links';
import { PropertyPathSegment, PropertyPathType } from './utilities/proxy-path';

interface BaseConstraint {
  path: PropertyPathSegment[];
  value?: Value<any>;
  creationMode?: ParentCreationMode;
  ancestorConstraints?: BaseConstraint[];
}

interface BasicStateConstraint extends BaseConstraint {
  value: Value<any>;
  ancestorCreationMode?: undefined;
  creationMode?: undefined;
}

interface AncestorStateConstraint extends BaseConstraint {
  value?: undefined;
  ancestorConstraints: StateConstraint[];
  creationMode?: undefined;
}

interface StateCreationConstraint extends BaseConstraint {
  value?: undefined;
  ancestorConstraints?: undefined;
  creationMode: ParentCreationMode;
}

export type StateConstraint =
  | BasicStateConstraint
  | AncestorStateConstraint
  | StateCreationConstraint;

export interface BaseStateAndConstraints {
  state?: ErasedDesiredState;
  name?: string;
  constraints: StateConstraint[];
}

export interface NewStateAndConstraints extends BaseStateAndConstraints {
  state: ErasedDesiredState;
  name?: undefined;
}

export interface ExistingStateAndConstraints extends BaseStateAndConstraints {
  name: string;
  state?: undefined;
}

export type StateAndConstraints =
  | NewStateAndConstraints
  | ExistingStateAndConstraints;

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
