import { ErasedDesiredState } from '../desired-state';
import { ErasedResourceInstance } from '../instance';
import { PropertyMap, Resource } from '../resource';
import { Expr, ObjectConstructor } from './ast/expressions';
import { Token, identifier } from './ast/tokens/token';
import { Context } from './context';

export const CREATED_STATE_KEY = '__createdState';

export const getNewContext = (
  resources: Resource<PropertyMap, PropertyMap>[]
) => {
  return {
    [CREATED_STATE_KEY]: Expr.ObjectConstructor(
      resources.map((res) => [identifier(res.name), Expr.ObjectConstructor([])])
    ),
  };
};

export const addCreatedResourceToContext = (
  context: Context,
  stateItem: ErasedDesiredState,
  instance: ErasedResourceInstance
): Context => {
  const newContext = { ...context };
  const outputObject = Expr.ObjectConstructor(
    Object.keys(instance.outputs).reduce((acc, outputKey) => {
      acc.push([
        identifier(outputKey),
        Expr.Literal(instance.outputs[outputKey]),
      ]);
      return acc;
    }, [] as [Token, Expr][])
  );
  newContext[stateItem.name] = outputObject;

  const createdState = newContext[CREATED_STATE_KEY] as ObjectConstructor;
  const createdStateForResource = createdState.fields.find(
    ([{ lexeme }]) => lexeme === stateItem.resource.name
  );
  if (!createdStateForResource) {
    return newContext;
  }
  const [, created] = createdStateForResource;
  const createdOfType = created as ObjectConstructor;
  createdOfType.fields.push([
    identifier(
      (
        instance.outputs[stateItem.resource.identifierProperty] as any
      ).toString()
    ),
    outputObject,
  ]);

  return newContext;
};
