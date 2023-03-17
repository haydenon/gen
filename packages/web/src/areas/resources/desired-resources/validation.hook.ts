import { validateResourceName } from '@haydenon/gen-core';
import { useCallback } from 'react';
import { useRecoilState } from 'recoil';
import { FormRuntimeValue } from '../runtime-value';

import {
  DesiredResource,
  DesiredStateFormError,
  ErrorPathType,
} from './desired-resource';
import {
  resourceDependencyState,
  formErrorsState,
} from './desired-resource.state';
import { ERROR_CATEGORIES } from './resource.errors';

const getDependencies = (value: any, path: string[]): [string, string[]][] => {
  if (
    value === null ||
    value === undefined ||
    ['boolean', 'string', 'number'].includes(typeof value) ||
    value instanceof Date
  ) {
    return [];
  }

  if (value instanceof FormRuntimeValue) {
    return value.dependentResourceIds.map((id) => [id, path]);
  }

  if (value instanceof Array) {
    return value.reduce(
      (acc, item, idx) => [
        ...acc,
        ...getDependencies(item, [...path, idx.toString()]),
      ],
      []
    );
  }

  if (typeof value === 'object') {
    return Object.keys(value).reduce(
      (acc, key) => [
        ...acc,
        ...getDependencies(value[key], [...path, key.toString()]),
      ],
      [] as [string, string[]][]
    );
  }

  throw new Error('Invalid value');
};

const pathsEqual = (path1: string[], path2: string[]): boolean =>
  path1.length === path2.length && path1.every((p1, idx) => path2[idx] === p1);

export const useResourceValidation = () => {
  const [dependentResources, setDependentResourceState] = useRecoilState(
    resourceDependencyState
  );
  const [formErrors, setErrorState] = useRecoilState(formErrorsState);

  const validateField = useCallback(
    (
      resources: DesiredResource[],
      resourceId: string,
      fieldName: string,
      currentValue: any,
      newValue: any
    ) => {
      // Update resource errors
      const newDependencies = getDependencies(newValue, [fieldName]);
      const invalidDependencyPaths = newDependencies
        .filter(([dependantOnId, _]) =>
          resources.every((r) => r.id !== dependantOnId)
        )
        .map(([_, path]) => path);
      const allPaths = newDependencies.map(([_, path]) => path);

      let errorsUpdated = false;
      let updatedErrors = formErrors.filter(
        (err) =>
          err.pathType !== ErrorPathType.Field ||
          err.resourceId !== resourceId ||
          err.errorCategory !==
            ERROR_CATEGORIES.DEPENDENCIES.DELETED_RESOURCE_DEPENDENCY ||
          invalidDependencyPaths.some((path) => pathsEqual(path, err.path))
      );
      if (updatedErrors.length !== formErrors.length) {
        errorsUpdated = true;
      }

      if (errorsUpdated) {
        setErrorState(updatedErrors);
      }

      // Update resource dependency information

      // Remove outdated dependancies
      let dependenciesChanged = false;
      let updatedDependencies = dependentResources.filter(
        (dr) =>
          dr.dependeeId === resourceId &&
          allPaths.some((path) => pathsEqual(path, dr.fieldPath))
      );
      if (updatedDependencies.length !== dependentResources.length) {
        dependenciesChanged = true;
      }

      // Add new dependancies
      const dependenciesToAdd = newDependencies.filter(([_, path]) =>
        updatedDependencies.every((d) => !pathsEqual(path, d.fieldPath))
      );
      if (dependenciesToAdd) {
        dependenciesChanged = true;
        for (const [dependantOnId, fieldPath] of dependenciesToAdd) {
          updatedDependencies.push({
            fieldPath,
            dependantOnId,
            dependeeId: resourceId,
          });
        }
      }

      if (dependenciesChanged) {
        setDependentResourceState(updatedDependencies);
      }
    },
    [formErrors, setErrorState, dependentResources, setDependentResourceState]
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
          acc[r.id] = [
            validationError,
            ERROR_CATEGORIES.NAMES.INVALID_RESOURCE_NAME,
          ];
        } else if (
          r.name &&
          resources.find((other) => other.id !== r.id && r.name === other.name)
        ) {
          acc[r.id] = [
            new Error(`'${r.name}' is used by other resources`),
            ERROR_CATEGORIES.NAMES.DUPLICATE_RESOURCE_NAME,
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

  const validateResourceRemoval = useCallback(
    (resourceId: string) => {
      let errorsChanged = false;

      // Remove resource errors
      let newErrors = formErrors.filter((err) => err.resourceId !== resourceId);
      if (newErrors.length < formErrors.length) {
        errorsChanged = true;
      }

      // Add errors for any resources dependant on this resources
      const dependantOnResource = dependentResources.filter(
        (dr) => dr.dependantOnId === resourceId
      );
      if (dependantOnResource.length > 0) {
        errorsChanged = true;
        for (const dependentOn of dependantOnResource) {
          newErrors.push({
            resourceId: dependentOn.dependeeId,
            error: new Error('A resource this value dependened on was deleted'),
            errorCategory:
              ERROR_CATEGORIES.DEPENDENCIES.DELETED_RESOURCE_DEPENDENCY,
            pathType: ErrorPathType.Field,
            path: dependentOn.fieldPath,
          });
        }
      }

      if (errorsChanged) {
        setErrorState(newErrors);
      }

      // Remove dependencies that this resource had
      const updatedDependentResources = dependentResources.filter(
        (r) => r.dependeeId === resourceId
      );
      if (updatedDependentResources.length < dependentResources.length) {
        setDependentResourceState(updatedDependentResources);
      }
    },
    [formErrors, setErrorState, dependentResources, setDependentResourceState]
  );

  return {
    validateField,
    validateNames,
    validateResourceRemoval,
    formErrors,
  };
};
