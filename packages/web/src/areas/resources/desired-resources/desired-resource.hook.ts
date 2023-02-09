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

import { creatingState, desiredResourceState } from './desired-resource.state';
import { DesiredResource } from './desired-resource';
import { transformFormValues } from './desired-state.utilities';

export const useDesiredResources = () => {
  const [desiredResources, setResources] = useRecoilState(desiredResourceState);
  const [createState, setCreatingState] = useRecoilState(creatingState);
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

  const updateResource = useCallback(
    (resource: DesiredResource) => {
      if (desiredResources.state !== ItemState.Completed) {
        return;
      }

      const resources = desiredResources.value;
      const idx = resources.findIndex((r) => r.id === resource.id);

      setResources(
        createCompleted([
          ...resources.slice(0, idx),
          resource,
          ...resources.slice(idx + 1),
        ])
      );
    },
    [desiredResources, setResources]
  );

  const deleteResource = useCallback(
    (id: string) => {
      if (desiredResources.state !== ItemState.Completed) {
        return;
      }

      const resources = desiredResources.value;
      const idx = resources.findIndex((r) => r.id === id);

      setResources(
        createCompleted([
          ...resources.slice(0, idx),
          ...resources.slice(idx + 1),
        ])
      );
    },
    [desiredResources, setResources]
  );

  const addResource = useCallback(() => {
    if (desiredResources.state !== ItemState.Completed) {
      return;
    }

    const resources = desiredResources.value;
    setResources(
      createCompleted([
        ...resources,
        {
          id: uuid(),
          fieldData: {},
        },
      ])
    );
  }, [desiredResources, setResources]);

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
  };
};
