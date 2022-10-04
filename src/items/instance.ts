import { OutputMap, PropertyValues } from './item';
import { OutputDefinition, PropertyType } from './properties';

export interface ItemInstance<Outputs extends OutputMap> {
  values: PropertyValues<OutputDefinition<PropertyType>, Outputs>;
}
