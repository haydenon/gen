import { useCallback } from 'react';
import { useRecoilState } from 'recoil';
import { createCompleted, ItemState, useFetch } from '../../data';

import { desiredResourceState, nextResourceId } from './desired-resource.state';
import { DesiredResource } from './ResourceList';

export const useDesiredResources = () => {
  const [desiredResources, setResources] = useRecoilState(desiredResourceState);
  const { fetch } = useFetch();

  const getDesiredResource = useCallback(
    (id: number) => {
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
    (id: number) => {
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
          id: nextResourceId(),
          fieldData: {},
        },
      ])
    );
  }, [desiredResources, setResources]);

  const resourceValues = desiredResources.value;

  const createDesiredState = useCallback(() => {
    if (!resourceValues) {
      return;
    }

    const stateBody = {
      state: resourceValues.map((r) => ({
        _type: r.type,
        _name: r.name,
        ...r.fieldData,
      })),
    };
    fetch('/v1/state', {
      method: 'POST',
      body: JSON.stringify(stateBody),
    }).then(console.log);
  }, [fetch, resourceValues]);

  return {
    desiredResources,
    getDesiredResource,
    updateResource,
    deleteResource,
    addResource,
    createDesiredState,
  };
};
