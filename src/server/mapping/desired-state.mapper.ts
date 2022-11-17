import { Resource } from '../../resources';
import {
  createDesiredState,
  ErasedDesiredState,
} from '../../resources/desired-state';
import { PropertyType } from '../../resources/properties/properties';
import { validateInputValues } from '../../resources/properties/validation';
import { PropertyMap } from '../../resources/resource';
import { RuntimeValue } from '../../resources/runtime-values';
import { parse } from '../../resources/runtime-values/ast/parser';
import { outputExprType } from '../../resources/runtime-values/types/expre-type.outputter';
import {
  complex,
  ExprType,
} from '../../resources/runtime-values/types/expression-types';
import { inferType } from '../../resources/runtime-values/types/inferrer/inferrer';
import { containsType } from '../../resources/runtime-values/types/inferrer/inferrer';
import { mapPropTypeToExprType } from '../../resources/runtime-values/types/prop-expr-type.mappers';
import { StateItem } from '../models/state-requests';
import { replaceRuntimeValueTemplates } from './runtime-value.mapper';

export type DesiredStateMapper = (
  item: StateItem,
  context: DesiredStateContext
) => ErasedDesiredState | Error[];

export interface DesiredStateContext {
  [desiredState: string]: ExprType;
}
export const getContextForDesiredState = (
  resources: Resource<PropertyMap, PropertyMap>[],
  context: StateItem[]
): DesiredStateContext | Error[] =>
  context.reduce((acc, stateItem) => {
    if (!stateItem._name) {
      return acc;
    }

    const resource = resources.find(
      (r) => r.constructor.name === stateItem._type
    );
    const createError = () =>
      new Error(
        `Invalid state item: resource type '${stateItem._type}' does not exist.`
      );
    if (acc instanceof Array && !resource) {
      return [...acc, createError()];
    } else if (!resource) {
      return [createError()];
    } else if (acc instanceof Array) {
      return acc;
    }

    const name = stateItem._name;
    acc[name] = complex(
      Object.keys(resource.outputs).reduce((outputs, output) => {
        outputs[output] = mapPropTypeToExprType(resource.outputs[output].type);
        return outputs;
      }, {} as { [field: string]: ExprType })
    );

    return acc;
  }, {} as DesiredStateContext | Error[]);

const createValidator = (context: DesiredStateContext) => {
  return (propType: PropertyType, value: RuntimeValue<any>) => {
    const requiredContext = Object.keys(context)
      .filter((stateItem) => value.depdendentStateNames.includes(stateItem))
      .reduce((acc, item) => {
        acc[item] = context[item];
        return acc;
      }, {} as { [name: string]: ExprType });
    const actualType = inferType(value.expression, requiredContext);
    if (actualType instanceof Error) {
      return actualType;
    }

    const expectedType = mapPropTypeToExprType(propType);
    return containsType(actualType, expectedType)
      ? undefined
      : new Error(
          `Expected type '${outputExprType(
            expectedType
          )}' but got '${outputExprType(actualType)}'`
        );
  };
};

export function getMapper(
  resources: Resource<PropertyMap, PropertyMap>[]
): DesiredStateMapper {
  return (state: StateItem, context: DesiredStateContext) => {
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
      inputs as { [prop: string]: any },
      createValidator(context)
    );
    if (inputResult instanceof Array) {
      return inputResult;
    }

    return createDesiredState(resource, inputResult, _name);
  };
}
