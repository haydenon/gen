import { ResolvedInputs } from '..';
import {
  PropertyMap,
  PropertyValues,
  Resource,
  ResourceGroup,
  ResourceOrGroupItem,
} from '../resource';
import { Constraint } from './constraints';
import {
  PropertyDefinition,
  PropertyType,
  PropertyTypeForValue,
  Value,
} from './properties';

export interface LinkProperty<T> extends PropertyDefinition<T> {
  item: Resource<PropertyMap, PropertyMap>;
  outputAccessor: (
    outputs: PropertyValues<PropertyMap>
  ) => PropertyTypeForValue<T>;
}

export function isLinkType(
  type: PropertyType
): type is PropertyType & LinkType {
  const prop = type as any as LinkType;
  return !!prop.resources && !!prop.outputKey;
}

export interface LinkType {
  resources: Resource<PropertyMap, PropertyMap>[];
  outputKey: string;
}

export enum ParentCreationMode {
  OnlySetIfParentCreated = 'OnlySetIfParentCreated',
  ForceParentCreation = 'ForceParentCreation',
}

export interface ParentConstraints<
  T extends ResourceOrGroupItem<PropertyMap, PropertyMap>
> {
  doNotCreateParent(): void;
  setValue<V>(
    accessor: (parentInputs: ResolvedInputs<T['inputs']>) => V,
    value: Value<V>,
    mode: ParentCreationMode
  ): void;
  all<V>(list: V[]): V;
}

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
): PropertyTypeForValue<T> & LinkType;
export function getLink<
  ResGroup extends ResourceGroup<PropertyMap, PropertyMap>,
  T
>(
  resources: ResGroup,
  accessor: (res: OutputsForResourceOrGroup<ResGroup>) => PropertyDefinition<T>,
  constraint?: LinkValueConstraint<ResGroup[0], T>
): PropertyTypeForValue<T> & LinkType;
export function getLink<
  Res extends
    | Resource<PropertyMap, PropertyMap>
    | ResourceGroup<PropertyMap, PropertyMap>,
  T
>(
  resources: Res,
  accessor: (res: OutputsForResourceOrGroup<Res>) => PropertyDefinition<T>,
  constraint?: LinkValueConstraint<
    Res extends Array<infer Item> ? Item : Res,
    T
  >
): PropertyTypeForValue<T> & LinkType {
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
