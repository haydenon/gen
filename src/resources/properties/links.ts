import { ResolvedInputs } from '..';
import * as util from 'util';
import {
  PropertyMap,
  PropertyValues,
  Resource,
  ResourceGroup,
  ResourceOrGroupItem,
} from '../resource';
import {
  PropertyPathSegment,
  arrayIndexAccess,
  propAccess,
  StateConstraint,
} from '../state-constraints';
import { Constraint } from './constraints';
import {
  PropertyDefinition,
  PropertyType,
  PropertyTypeForValue,
  Value,
} from './properties';

export function isLinkType(
  type: PropertyType
): type is PropertyType & LinkType<any> {
  const prop = type as any as LinkType<any>;
  return !!prop.resources && !!prop.outputKey;
}

export interface LinkType<
  Parent extends ResourceOrGroupItem<PropertyMap, PropertyMap>
> {
  resources: Parent[];
  outputKey: string;
}

export interface LinkPropertyDefinition<
  Parent extends ResourceOrGroupItem<PropertyMap, PropertyMap>,
  T
> extends PropertyDefinition<T> {
  type: PropertyTypeForValue<T> & LinkType<Parent>;
}

export enum ParentCreationMode {
  OnlySetIfParentCreated = 'OnlySetIfParentCreated',
  ForceParentCreation = 'ForceParentCreation',
}

export interface ParentConstraints<
  T extends ResourceOrGroupItem<PropertyMap, PropertyMap>
> {
  doNotCreate(): void;
  setValue<V>(
    accessor: (parentInputs: ResolvedInputs<T['inputs']>) => V,
    value: Value<V>,
    mode: ParentCreationMode
  ): void;
  ancestor<Ancestor extends ResourceOrGroupItem<PropertyMap, PropertyMap>>(
    accessor: (
      parentInputs: T['inputs']
    ) => LinkPropertyDefinition<Ancestor, any>,
    mode: ParentCreationMode
  ): ParentConstraints<Ancestor>;
}

export const constrainAll = <T>(value: T[]): T => {
  if (util.types.isProxy(value)) {
    (value as any).__setPathValue__ = new AllIndexMarker();
    return value as any;
  }

  throw new Error('Expected a valid parent value to be passed in');
};

class ParentProxyHandler {
  public proxy?: typeof Proxy;
  public paths: (string | number | symbol | AllIndexMarker)[] = [];

  get(_: any, property: string | number | symbol): typeof Proxy {
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

class AllIndexMarker {}

export const getParentConstraintsUtilsAndResults = (): [
  ParentConstraints<any>,
  StateConstraint[]
] => {
  const results: StateConstraint[] = [];
  const getPath = (accessor: (inputs: any) => any): PropertyPathSegment[] => {
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
  return [
    {
      setValue(accessor, value, mode) {
        const path = getPath(accessor);
        results.push({
          path,
          value,
          mode,
        });
      },
      doNotCreate() {
        throw new Error('TODO!');
      },
      ancestor<Ancestor extends ResourceOrGroupItem<PropertyMap, PropertyMap>>(
        accessor: (parentInputs: any) => LinkPropertyDefinition<Ancestor, any>,
        mode: ParentCreationMode
      ) {
        const [parentConstraints, constraints] =
          getParentConstraintsUtilsAndResults();
        const path = getPath(accessor);
        results.push({
          path,
          ancestorConstraints: constraints,
          mode,
        });
        return parentConstraints;
      },
    },
    results,
  ];
};

export function parentConstraint<
  Inputs extends PropertyMap,
  Parent extends ResourceOrGroupItem<PropertyMap, PropertyMap>
>(
  inputs: Inputs,
  parent: Parent,
  func: (
    constraints: ParentConstraints<Parent>,
    childValues: PropertyValues<Inputs>
  ) => void
): LinkConstraint<Parent> {
  return {
    parentConstraint: func as (
      constraints: ParentConstraints<Parent>,
      childValues: PropertyValues<PropertyMap>
    ) => void,
  };
}

export interface LinkConstraint<
  T extends ResourceOrGroupItem<PropertyMap, PropertyMap>
> {
  parentConstraint?: (
    constraints: ParentConstraints<T>,
    childValues: PropertyValues<PropertyMap>
  ) => void;
}

export type LinkValueConstraint<
  Res extends ResourceOrGroupItem<PropertyMap, PropertyMap>,
  T
> = Constraint<T> & LinkConstraint<Res>;

type OutputsForResourceOrGroup<T> = T extends Resource<PropertyMap, PropertyMap>
  ? T['outputs']
  : T extends ResourceGroup<PropertyMap, PropertyMap>
  ? T[0]['outputs']
  : never;

export function getLink<Res extends Resource<PropertyMap, PropertyMap>, T>(
  resource: Res,
  accessor: (res: OutputsForResourceOrGroup<Res>) => PropertyDefinition<T>,
  constraint?: LinkValueConstraint<Res, T>
): PropertyTypeForValue<T> & LinkType<Res>;
export function getLink<
  ResGroup extends ResourceGroup<PropertyMap, PropertyMap>,
  T
>(
  resources: ResGroup,
  accessor: (res: OutputsForResourceOrGroup<ResGroup>) => PropertyDefinition<T>,
  constraint?: LinkValueConstraint<ResGroup[0], T>
): PropertyTypeForValue<T> & LinkType<ResGroup[0]>;
export function getLink<
  Res extends ResourceOrGroupItem<PropertyMap, PropertyMap>,
  T
>(
  resources: Res,
  accessor: (res: OutputsForResourceOrGroup<Res>) => PropertyDefinition<T>,
  constraint?: LinkValueConstraint<
    Res extends Array<infer Item> ? Item : Res,
    T
  >
): PropertyTypeForValue<T> & LinkType<Res> {
  const paths: string[] = [];

  // We want to get a string representation of the property name so we can use
  // it in expressions. Functions have better intellisense support, though so we're
  // using a proxy to get the property name.

  // eslint-disable-next-line prefer-const
  let proxy: typeof Proxy;
  const handler = {
    get(_: any, property: string) {
      if (paths.length > 0) {
        // TODO: Support nested link properties?
        throw new Error('Nested link properties are not yet supported.');
      }
      paths.push(property);
      return proxy;
    },
  };
  proxy = new Proxy({}, handler);
  accessor(proxy as any);
  if (paths.length !== 1) {
    throw new Error('Invalid link property.');
  }

  const resourceOutputs =
    resources instanceof Array
      ? (resources as ResourceGroup<any, any>)[0].outputs
      : resources.outputs;
  const outputProperty = accessor(resourceOutputs);
  const linkType: PropertyTypeForValue<T> = outputProperty.type as any;
  return {
    ...linkType,
    resources: resources instanceof Array ? resources : [resources],
    outputKey: paths[0].toString(),
    constraint,
  } as any;
}
