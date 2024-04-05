import { AllIndexMarker, isProxy } from '../properties/links';

export enum PropertyPathType {
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

export class ParentProxyHandler {
  public proxy?: typeof Proxy;
  public paths: (string | number | symbol | AllIndexMarker)[] = [];

  get(_: any, property: string | number | symbol): typeof Proxy {
    if (property === isProxy) {
      return true as any;
    }

    const asInt =
      typeof property === 'string'
        ? parseInt(property)
        : typeof property === 'number'
        ? property
        : NaN;
    if (!isNaN(asInt)) {
      this.paths.push(asInt);
    } else {
      this.paths.push(property);
    }
    if (!this.proxy) {
      throw new Error('Proxy incorrectly configured');
    }

    return this.proxy;
  }

  set(
    target: any,
    prop: string,
    value: string | number | symbol | AllIndexMarker
  ) {
    if (prop === '__setPathValue__') {
      this.paths.push(value);
      return true;
    }

    throw new Error('Invalid property accessor');
  }
}

export const getPathFromAccessor = (
  accessor: (inputs: any) => any
): PropertyPathSegment[] => {
  const handler = new ParentProxyHandler();
  const parentValueProxy = new Proxy({}, handler);
  handler.proxy = parentValueProxy;
  accessor(parentValueProxy as any);
  return handler.paths.map((p) =>
    // TODO: Support all indexes for arrays
    typeof p === 'number'
      ? arrayIndexAccess(p)
      : p instanceof AllIndexMarker
      ? arrayIndexAccess('all')
      : propAccess(p)
  ) as PropertyPathSegment[];
};
