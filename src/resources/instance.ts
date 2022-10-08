import { OutputMap, PropertyValues } from './resource';
import { OutputDefinition, PropertyType } from './properties';

export interface ResourceInstance<Outputs extends OutputMap> {
  values: PropertyValues<OutputDefinition<PropertyType>, Outputs>;
}
