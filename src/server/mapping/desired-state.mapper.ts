import { Resource } from '../../resources';
import {
  createDesiredState,
  ErasedDesiredState,
} from '../../resources/desired-state';
import { validateInputValues } from '../../resources/properties/validation';
import { PropertyMap } from '../../resources/resource';
import { parse } from '../../resources/runtime-values/ast/parser';
import { StateItem } from '../models/state-requests';
import { replaceRuntimeValueTemplates } from './runtime-value.mapper';

export type DesiredStateMapper = (
  item: StateItem
) => ErasedDesiredState | Error[];

export function getMapper(
  resources: Resource<PropertyMap, PropertyMap>[]
): DesiredStateMapper {
  return (state: StateItem) => {
    const { _type, _name, ...userSuppliedInputs } = state;
    const resource = resources.find((r) => r.constructor.name === state._type);
    if (!resource) {
      return [
        new Error(
          `Invalid state item: resource type '${_type}' does not exist.`
        ),
      ];
    }

    const [inputs, errors] = replaceRuntimeValueTemplates(
      userSuppliedInputs,
      parse
    );
    if (errors.length > 0) {
      return errors;
    }

    const inputResult = validateInputValues(
      _name ?? _type,
      resource.inputs,
      inputs as { [prop: string]: any }
    );
    if (inputResult instanceof Array) {
      return inputResult;
    }

    return createDesiredState(resource, inputResult, _name);
  };
}
