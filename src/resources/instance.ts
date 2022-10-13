import { PropertyMap, PropertyValues } from './resource';

export interface ResourceInstance<Outputs extends PropertyMap> {
  values: PropertyValues<Outputs>;
}
