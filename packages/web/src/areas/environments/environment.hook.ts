import { useRecoilState } from 'recoil';
import {
  currentEnvironmentState,
  environmentsState,
} from './environment.state';
import {
  ItemState,
  createCompleted,
  createErrored,
  createLoading,
  useFetch,
} from '../../data';
import { useCallback } from 'react';

export const useEnvironments = () => {
  const [environments, setEnvironments] = useRecoilState(environmentsState);
  const [currentEnvironment, setCurrentEnvironment] = useRecoilState(
    currentEnvironmentState
  );
  const isUninitialised = environments.state === ItemState.Uninitialised;
  const { fetch } = useFetch();

  const getEnvironments = useCallback(() => {
    setEnvironments(createLoading());

    fetch<{ environments: { name: string }[] }>('/v1/environment', {
      method: 'GET',
    })
      .then((resp) => {
        const environments = resp.environments.map(({ name }) => name);
        setEnvironments(createCompleted(environments));
        setCurrentEnvironment(environments[0]);
      })
      .catch((err) => createErrored(err));
  }, [fetch, setEnvironments, setCurrentEnvironment]);

  const loadEnvironments = useCallback(() => {
    if (!isUninitialised) {
      return;
    }

    getEnvironments();
  }, [isUninitialised, getEnvironments]);

  return {
    loadEnvironments,
    environments,
    currentEnvironment,
    setCurrentEnvironment,
  };
};
