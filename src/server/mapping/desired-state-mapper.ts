import { Resource } from '../../resources';
import {
  createDesiredState,
  ErasedDesiredState,
} from '../../resources/desired-state';
import { PropertyMap } from '../../resources/resource';
import { StateItem } from '../models/state-requests';

export type DesiredStateMapper = (
  item: StateItem
) => ErasedDesiredState | Error;

export function getMapper(
  resources: Resource<PropertyMap, PropertyMap>[]
): DesiredStateMapper {
  return (state: StateItem) => {
    const resource = resources.find((r) => r.constructor.name === state._type);
    if (!resource) {
      return new Error(
        `Invalid state item: resource type '${state._type}' does not exist.`
      );
    }

    return createDesiredState(resource, {});
  };
}
