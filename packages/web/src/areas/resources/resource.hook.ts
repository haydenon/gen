import { useCallback } from 'react';
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

    fetch<ResourceResponse[]>('/v1/resource', {
      method: 'GET',
    })
      .then((resources) => setResources(createCompleted(resources)))
      .catch((err) => createErrored(err));
  }, [fetch, setResources]);

  const loadResourceDefinitions = useCallback(() => {
    if (!isUninitialised) {
      return;
    }

    getResources();
  }, [isUninitialised, getResources]);
  return {
    loadResourceDefinitions,
  };
};
