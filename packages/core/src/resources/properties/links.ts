import {
  PropertyMap,
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
import { LinkConstraint, ParentConstraints } from './constraints';
import {
  IntType,
  LinkType,
  LinkOfType,
  PropertyDefinition,
  PropertyType,
  StringType,
  Type,
  TypeForProperty,
} from './properties';

export function isLinkType(type: PropertyType): type is LinkType<any> {
  const prop = type as any as LinkType<any>;
  return !!prop.resources && !!prop.outputKey;
}

export enum ParentCreationMode {
  Create = 'Create',
  DoNotCreate = 'DoNotCreate',
  MaybeCreate = 'MaybeCreate',
}

const isProxy = Symbol('__isProxy');

export const constrainAll = <T>(value: T[]): T => {
  if (value && (value as any).__isProxy) {
    (value as any).__setPathValue__ = new AllIndexMarker();
    return value as any;
  }

  throw new Error('Expected a valid parent value to be passed in');
};

class ParentProxyHandler {
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
      setValue(accessor, value) {
        const path = getPath(accessor);
        results.push({
          path,
          value,
        });
      },
      ancestor(
        accessor: (parentInputs: any) => string | number | undefined,
        creationMode?: ParentCreationMode
      ) {
        const [parentConstraints, constraints] =
          getParentConstraintsUtilsAndResults();
        const path = getPath(accessor);
        results.push({
          path,
          ancestorConstraints: constraints,
        });
        if (creationMode) {
          results.push({
            path,
            creationMode,
          });
        }

        return parentConstraints;
      },
    },
    results,
  ];
};

export interface ParentCreationConstraint {
  mode?: ParentCreationMode;
}

type OutputsForResourceOrGroup<T> = T extends Resource<PropertyMap, PropertyMap>
  ? T['outputs']
  : T extends ResourceGroup<PropertyMap, PropertyMap>
  ? T['items'][0]['outputs']
  : never;

type BaseLinkType<Prop extends PropertyDefinition<any>> =
  TypeForProperty<Prop> extends number
    ? IntType
    : TypeForProperty<Prop> extends string
    ? StringType
    : never;

export function getLink<
  Res extends Resource<PropertyMap, PropertyMap>,
  T,
  Prop extends PropertyDefinition<T>
>(
  resource: Res,
  accessor: (res: OutputsForResourceOrGroup<Res>) => PropertyDefinition<T>,
  constraint?: LinkConstraint<Res>
): LinkOfType<Res, BaseLinkType<Prop>, true>;
export function getLink<
  ResGroup extends ResourceGroup<PropertyMap, PropertyMap>,
  T,
  Prop extends PropertyDefinition<T>
>(
  resources: ResGroup,
  accessor: (res: OutputsForResourceOrGroup<ResGroup>) => PropertyDefinition<T>,
  constraint?: LinkConstraint<ResGroup['items'][0]>
): LinkOfType<ResGroup['items'][0], BaseLinkType<Prop>, true>;
export function getLink<
  Res extends ResourceOrGroupItem<PropertyMap, PropertyMap>,
  T,
  Prop extends PropertyDefinition<T>
>(
  resources: Res,
  accessor: (res: OutputsForResourceOrGroup<Res>) => Prop,
  constraint?: LinkConstraint<Res>
): LinkOfType<Res, BaseLinkType<Prop>, true> {
  return getLinkBase<T, Prop, Res, true>(resources, accessor, constraint, true);
}

export function getOptionalLink<
  Res extends Resource<PropertyMap, PropertyMap>,
  T,
  Prop extends PropertyDefinition<T>
>(
  resource: Res,
  accessor: (res: OutputsForResourceOrGroup<Res>) => PropertyDefinition<T>,
  mode: ParentCreationMode,
  constraint?: LinkConstraint<Res>
): LinkOfType<Res, BaseLinkType<Prop>, false>;
export function getOptionalLink<
  ResGroup extends ResourceGroup<PropertyMap, PropertyMap>,
  T,
  Prop extends PropertyDefinition<T>
>(
  resources: ResGroup,
  accessor: (res: OutputsForResourceOrGroup<ResGroup>) => PropertyDefinition<T>,
  mode: ParentCreationMode,
  constraint?: LinkConstraint<ResGroup['items'][0]>
): LinkOfType<ResGroup['items'][0], BaseLinkType<Prop>, false>;
export function getOptionalLink<
  Res extends ResourceOrGroupItem<PropertyMap, PropertyMap>,
  T,
  Prop extends PropertyDefinition<T>
>(
  resources: Res,
  accessor: (res: OutputsForResourceOrGroup<Res>) => Prop,
  mode: ParentCreationMode,
  constraint?: LinkConstraint<Res>
): LinkOfType<Res, BaseLinkType<Prop>, false> {
  return getLinkBase<T, Prop, Res, false>(
    resources,
    accessor,
    constraint,
    false,
    mode
  );
}

function getLinkBase<
  T,
  Prop extends PropertyDefinition<T>,
  Res extends ResourceOrGroupItem<PropertyMap, PropertyMap>,
  Required extends boolean
>(
  resources: Res,
  accessor: (res: OutputsForResourceOrGroup<Res>) => Prop,
  constraint: LinkConstraint<Res> | undefined,
  required: Required,
  mode?: ParentCreationMode
): LinkOfType<Res, BaseLinkType<Prop>, Required> {
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
    resources instanceof ResourceGroup
      ? (resources as ResourceGroup<any, any>).items[0].outputs
      : resources.outputs;
  const outputProperty = accessor(resourceOutputs);
  const linkedProperty: Prop = outputProperty;
  const linkType: LinkOfType<Res, BaseLinkType<Prop>, Required> = {
    type: Type.Link,
    inner: linkedProperty.type as any,
    required,
    resources:
      resources instanceof ResourceGroup
        ? (resources.items as any)
        : [resources],
    outputKey: paths[0].toString(),
    constraint,
    ...(mode ? { mode } : {}),
  };

  return linkType;
}
