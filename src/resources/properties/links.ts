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
  TypeForProperty,
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

type OutputForResourceOrGroup<T, Key> = T extends Resource<
  PropertyMap,
  PropertyMap
>
  ? Key extends keyof T['outputs']
    ? T['outputs'][Key]
    : never
  : T extends ResourceGroup<PropertyMap, PropertyMap>
  ? Key extends keyof T[0]['outputs']
    ? T[0]['outputs'][Key]
    : never
  : never;

export function getLink<
  Res extends Resource<PropertyMap, PropertyMap>,
  Key extends keyof Res['outputs'],
  T extends TypeForProperty<Res['outputs'][Key]>
>(
  resource: Res,
  propKey: Key,
  constraint?: LinkValueConstraint<Res, T>
): PropertyTypeForValue<T> & LinkType;
export function getLink<
  ResGroup extends ResourceGroup<PropertyMap, PropertyMap>,
  Key extends keyof ResGroup[0]['outputs'],
  T extends TypeForProperty<ResGroup[0]['outputs'][Key]>
>(
  resources: ResGroup,
  propKey: Key,
  constraint?: LinkValueConstraint<ResGroup[0], T>
): PropertyTypeForValue<T> & LinkType;
export function getLink<
  Res extends
    | Resource<PropertyMap, PropertyMap>
    | ResourceGroup<PropertyMap, PropertyMap>,
  Key extends OutputsForResourceOrGroup<Res>,
  T extends TypeForProperty<OutputForResourceOrGroup<Res, Key>>
>(
  resources: Res | Res[],
  propKey: Key,
  constraint?: LinkValueConstraint<
    Res extends Array<infer Item> ? Item : Res,
    T
  >
): PropertyTypeForValue<T> & LinkType {
  const resourceOutputs: PropertyMap = //Res extends ResourceGroup<any, any> ? Res[0]['outputs'] : Res extends Resource<any, any> ? Res['outputs'] :never =
    resources instanceof Array
      ? (resources as ResourceGroup<any, any>)[0].outputs
      : resources.outputs;
  const outputProperty = resourceOutputs[propKey as any];
  const linkType: PropertyTypeForValue<T> = outputProperty.type as any;
  return {
    ...linkType,
    resources: resources instanceof Array ? resources : [resources],
    outputKey: propKey.toString(),
    constraint,
  } as any;
}
