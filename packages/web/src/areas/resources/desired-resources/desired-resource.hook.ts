import { useCallback } from 'react';
import { useRecoilState } from 'recoil';
import { v4 as uuid } from 'uuid';
import {
  createCompleted,
  createErrored,
  createLoading,
  ItemState,
  useFetch,
} from '../../../data';

import {
  creatingState,
  desiredResourceState,
  formErrorsState,
  resourceDependencyState,
} from './desired-resource.state';
import {
  DesiredResource,
  DesiredStateFormError,
  ErrorPathType,
} from './desired-resource';
import { transformFormValues } from './desired-state.utilities';
import { validateResourceName } from '@haydenon/gen-core';

export const useDesiredResources = () => {
  const [desiredResources, setResources] = useRecoilState(desiredResourceState);
  const [createState, setCreatingState] = useRecoilState(creatingState);
  const [dependentResources, setDependentResourceState] = useRecoilState(
    resourceDependencyState
  );
  const [formErrors, setErrorState] = useRecoilState(formErrorsState);
  const { fetch } = useFetch();

  const getDesiredResource = useCallback(
    (id: string) => {
      if (desiredResources.state !== ItemState.Completed) {
        return undefined;
      }

      return desiredResources.value.find((r) => r.id === id);
    },
    [desiredResources]
  );

  const validateField = useCallback(
    (
      resourceId: string,
      fieldName: string,
      currentValue: any,
      newValue: any
    ) => {
      const existingErrors = formErrors.filter(
        (err) =>
          err.pathType === ErrorPathType.Field &&
          err.resourceId === resourceId &&
          err.path[0] === fieldName
      );

      // Remove dependent resource errors for this field if applicable
    },
    [formErrors, setErrorState, dependentResources]
  );

  const validateNames = useCallback(
    (resources: DesiredResource[]) => {
      const currentNameErrors = formErrors.filter(
        (err) =>
          err.pathType === ErrorPathType.Root &&
          err.path.length === 1 &&
          err.path[0] === 'name'
      );

      const erroredResourcesState = resources.reduce((acc, r) => {
        const validationError = validateResourceName(r.name);
        if (validationError) {
          acc[r.id] = [validationError, 'invalid_resource_name'];
        } else if (
          r.name &&
          resources.find((other) => other.id !== r.id && r.name === other.name)
        ) {
          acc[r.id] = [
            new Error(`'${r.name}' is used by other resources`),
            'duplicate_resource_name',
          ];
        }
        return acc;
      }, {} as { [id: string]: [Error, string] });

      const errorsToKeep = currentNameErrors.filter(
        (err) => err.resourceId in erroredResourcesState
      );
      const additionalErrors: DesiredStateFormError[] = Object.keys(
        erroredResourcesState
      )
        .filter((id) => currentNameErrors.every((err) => err.resourceId !== id))
        .map((resourceId) => {
          const [error, errorCategory] = erroredResourcesState[resourceId];
          return {
            resourceId,
            error,
            errorCategory,
            pathType: ErrorPathType.Root,
            path: ['name'],
          };
        });

      const nonNameErrors = formErrors.filter(
        (err) => !currentNameErrors.includes(err)
      );
      const newErrors = [
        ...nonNameErrors,
        ...errorsToKeep,
        ...additionalErrors,
      ];
      setErrorState(newErrors);
    },
    [formErrors, setErrorState]
  );

  const updateResource = useCallback(
    (resource: DesiredResource) => {
      if (desiredResources.state !== ItemState.Completed) {
        return;
      }

      const resources = desiredResources.value;
      const idx = resources.findIndex((r) => r.id === resource.id);
      const current = resources[idx];

      const updatedResources = [
        ...resources.slice(0, idx),
        resource,
        ...resources.slice(idx + 1),
      ];
      setResources(createCompleted(updatedResources));

      if (current.name !== resource.name) {
        validateNames(updatedResources);
      } else {
        const fields = Array.from(
          new Set([
            ...Object.keys(current.fieldData),
            ...Object.keys(resource.fieldData),
          ])
        );
        const changedFields = fields.filter(
          (f) => current.fieldData[f] !== resource.fieldData[f]
        );
        for (const changedField of changedFields) {
          validateField(
            resource.id,
            changedField,
            current.fieldData[changedField],
            resource.fieldData[changedField]
          );
        }
      }
    },
    [desiredResources, setResources, validateNames]
  );

  const deleteResource = useCallback(
    (id: string) => {
      if (desiredResources.state !== ItemState.Completed) {
        return;
      }

      const resources = desiredResources.value;
      const idx = resources.findIndex((r) => r.id === id);

      // TODO: Add errors to dependent fields

      setResources(
        createCompleted([
          ...resources.slice(0, idx),
          ...resources.slice(idx + 1),
        ])
      );
    },
    [desiredResources, setResources]
  );

  const addResource = useCallback(
    (resource: DesiredResource) => {
      if (desiredResources.state !== ItemState.Completed) {
        return;
      }

      const resources = desiredResources.value;
      setResources(createCompleted([...resources, resource]));
    },
    [desiredResources, setResources]
  );

  const resourceValues = desiredResources.value;
  const isCreating = createState.state === ItemState.Loading;

  const createDesiredState = useCallback(() => {
    if (!resourceValues || isCreating) {
      return;
    }

    const stateBody = {
      state: resourceValues.map((r) => ({
        _type: r.type,
        _name: r.name,
        ...transformFormValues(r.fieldData, {
          desiredResources: resourceValues,
        }),
      })),
    };
    setCreatingState(createLoading());

    fetch('/v1/state', {
      method: 'POST',
      body: JSON.stringify(stateBody),
    })
      .then(() => setCreatingState(createCompleted(undefined)))
      .catch((error) => setCreatingState(createErrored(error)));
  }, [fetch, resourceValues, isCreating, setCreatingState]);

  return {
    desiredResources,
    getDesiredResource,
    updateResource,
    deleteResource,
    addResource,
    createDesiredState,
    isCreating,
    formErrors,
  };
};
