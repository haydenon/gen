import { useCallback, useMemo } from 'react';
import { useRecoilState } from 'recoil';
import {
  createCompleted,
  createErrored,
  createLoading,
  ItemState,
  useFetch,
} from '../../data';
import { ResourceResponse } from '../../../../server/src/server/models/resource.response';
import { resourceState } from './resource.state';

export const useResources = () => {
  const [resources, setResources] = useRecoilState(resourceState);
  const isUninitialised = resources.state === ItemState.Uninitialised;
  const { fetch } = useFetch();

  const getResources = useCallback(() => {
    setResources(createLoading());

    fetch<{ resources: ResourceResponse[] }>('/v1/resource', {
      method: 'GET',
    })
      .then((resp) => setResources(createCompleted(resp.resources)))
      .catch((err) => createErrored(err));
  }, [fetch, setResources]);

  const loadResourceDefinitions = useCallback(() => {
    if (!isUninitialised) {
      return;
    }

    getResources();
  }, [isUninitialised, getResources]);

  const getResource = useCallback(
    (name: string) => {
      if (resources.state !== ItemState.Completed) {
        return undefined;
      }

      return resources.value.find((r) => r.name === name);
    },
    [resources]
  );

  const resourceNames = useMemo(() => {
    if (resources.state !== ItemState.Completed) {
      return [];
    }

    return resources.value.map((r) => r.name);
  }, [resources]);

  return {
    loadResourceDefinitions,
    resources,
    getResource,
    resourceNames,
  };
};
