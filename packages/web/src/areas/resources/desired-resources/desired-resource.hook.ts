import { useCallback, useEffect } from 'react';
import { useRecoilState } from 'recoil';
import {
  createCompleted,
  createErrored,
  createLoading,
  ItemState,
  useFetch,
} from '../../../data';

import { creatingState, desiredResourceState } from './desired-resource.state';
import { DesiredResource } from './desired-resource';
import { transformFormValues } from './desired-state.utilities';
import { useResourceValidation } from './validation.hook';
import useLocalStorage from 'react-use-localstorage';

export const useDesiredResources = () => {
  const [desiredResources, setResources] = useRecoilState(desiredResourceState);
  const [createState, setCreatingState] = useRecoilState(creatingState);
  const { validateField, validateNames, validateResourceRemoval, formErrors } =
    useResourceValidation();

  const { fetch } = useFetch();

  const [savedResources, setSavedResources] = useLocalStorage(
    'Editor.DesiredResources',
    undefined
  );

  const setDesiredResources = useCallback(
    (resources: DesiredResource[]) => {
      setResources(createCompleted(resources));
      setSavedResources(JSON.stringify(resources));
    },
    [setResources, setSavedResources]
  );

  const desiredResourceStatus = desiredResources.state;
  useEffect(() => {
    if (desiredResourceStatus === ItemState.Uninitialised) {
      let resources: DesiredResource[];
      try {
        const parsed = JSON.parse(savedResources);
        resources =
          parsed instanceof Array ? (parsed as DesiredResource[]) : [];
      } catch {
        resources = [];
      }
      setResources(createCompleted(resources));
    }
  }, [desiredResourceStatus, savedResources, setResources]);

  const getDesiredResource = useCallback(
    (id: string) => {
      if (desiredResources.state !== ItemState.Completed) {
        return undefined;
      }

      return desiredResources.value.find((r) => r.id === id);
    },
    [desiredResources]
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
      setDesiredResources(updatedResources);

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
            resources,
            resource.id,
            changedField,
            current.fieldData[changedField],
            resource.fieldData[changedField]
          );
        }
      }
    },
    [desiredResources, setDesiredResources, validateNames, validateField]
  );

  const deleteResource = useCallback(
    (id: string) => {
      if (desiredResources.state !== ItemState.Completed) {
        return;
      }

      const resources = desiredResources.value;
      const idx = resources.findIndex((r) => r.id === id);

      validateResourceRemoval(id);

      setDesiredResources([
        ...resources.slice(0, idx),
        ...resources.slice(idx + 1),
      ]);
    },
    [desiredResources, setDesiredResources, validateResourceRemoval]
  );

  const addResource = useCallback(
    (resource: DesiredResource) => {
      if (desiredResources.state !== ItemState.Completed) {
        return;
      }

      const resources = desiredResources.value;
      setDesiredResources([...resources, resource]);
    },
    [desiredResources, setDesiredResources]
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
