import { DesiredState } from './desired-state';
import { PropertyMap, PropertyValues } from './resource';

export interface ResourceInstance<Outputs extends PropertyMap> {
  desiredState: DesiredState;
  outputs: PropertyValues<Outputs>;
}
