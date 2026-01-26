import {
  Resource,
  createDesiredState,
  ErasedDesiredState,
  ExprType,
  complexObject,
  mapPropTypeToExprType,
  PropertyMap,
  PropertyType,
  RuntimeValue,
  BASE_CONTEXT_TYPES,
  replaceRuntimeValueTemplates,
} from '@haydenon/gen-core';
import { validateInputValues } from '@haydenon/gen-core/src/resources/properties';
import { validateResourceName } from '@haydenon/gen-core/src/resources/resource';
import {
  outputExprType,
  parse,
} from '@haydenon/gen-core/src/resources/runtime-values';
import {
  containsType,
  inferType,
} from '@haydenon/gen-core/src/resources/runtime-values/types/inferrer/inferrer';
import { StateItem } from '../models/state-requests';

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
): DesiredStateContext | Error[] => {
  const duplicateName = context.find(
    (s) => s._name && context.some((ds) => ds !== s && ds._name === s._name)
  );
  if (duplicateName !== undefined) {
    return [
      new Error(
        `Invalid state: contains multiple state items with name '${duplicateName._name}'`
      ),
    ];
  }

  return context.reduce((acc, stateItem) => {
    if (!stateItem._name) {
      return acc;
    }

    const resource = resources.find((r) => r.name === stateItem._type);
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
    acc[name] = complexObject(
      Object.keys(resource.outputs).reduce((outputs, output) => {
        outputs[output] = mapPropTypeToExprType(resource.outputs[output].type);
        return outputs;
      }, {} as { [field: string]: ExprType })
    );

    return acc;
  }, {} as DesiredStateContext | Error[]);
};

const createValidator = (context: DesiredStateContext) => {
  return (propType: PropertyType, value: RuntimeValue<any>) => {
    const requiredContext = Object.keys(context)
      .filter((stateItem) => value.depdendentStateNames.includes(stateItem))
      .reduce((acc, item) => {
        acc[item] = context[item];
        return acc;
      }, {} as { [name: string]: ExprType });
    const typeContext = {
      ...requiredContext,
      ...BASE_CONTEXT_TYPES,
    };

    const actualType = inferType(value.expression, typeContext);
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
    const resource = resources.find((r) => r.name === state._type);
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

    const nameError = validateResourceName(state._name);
    if (nameError) {
      return [nameError];
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
