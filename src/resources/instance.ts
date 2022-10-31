import { DesiredState } from './desired-state';
import { PropertyMap, PropertyValues, Resource } from './resource';

export interface ResourceInstance<
  Res extends Resource<PropertyMap, PropertyMap>
> {
  desiredState: DesiredState<Res>;
  outputs: PropertyValues<Res['outputs']>;
}

export type ErasedResourceInstance = ResourceInstance<Resource<PropertyMap, PropertyMap>>;
