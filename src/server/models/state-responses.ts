import { ErasedDesiredState } from '../../resources/desired-state';
import { ErasedResourceInstance } from '../../resources/instance';

const specialKeys = ['_type', '_name'];

const removeSpecialFields = (value: {
  [property: string]: any;
}): { [property: string]: any } => {
  return Object.keys(value).reduce((acc, key) => {
    if (specialKeys.includes(key)) {
      return acc;
    }
    acc[key] = value[key];
    return acc;
  }, {} as { [property: string]: any });
};

export interface DesiredStateItem {
  _name: string;
  _type: string;
  [property: string]: any;
}

export function mapDesiredStateToResponse(
  desired: ErasedDesiredState
): DesiredStateItem {
  return {
    _name: desired.name,
    _type: desired.resource.constructor.name,
    ...removeSpecialFields(desired.inputs),
  };
}

export interface CreatedStateItem {
  _name: string;
  _type: string;
  [property: string]: any;
}

export function mapResourceInstanceToResponse(
  instance: ErasedResourceInstance
): CreatedStateItem {
  return {
    _name: instance.desiredState.name,
    _type: instance.desiredState.resource.constructor.name,
    ...removeSpecialFields(instance.outputs),
  };
}
