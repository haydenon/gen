import { useCallback, useEffect, useMemo } from 'react';
import { useRecoilState } from 'recoil';
import {
  createCompleted,
  createErrored,
  createUninitialised,
  isUninitialisedOrLoading,
  ItemState,
  useFetch,
} from '../../../data';

import {
  CreatingState,
  creatingState,
  desiredResourceState,
} from './desired-resource.state';
import { DesiredResource } from './desired-resource';
import { transformFormValues } from './desired-state.utilities';
import { useResourceValidation } from './validation.hook';
import useLocalStorage from 'react-use-localstorage';
import { StateCreateResponse } from '@haydenon/gen-server';
import { getAnonymousName } from '@haydenon/gen-core';
import { useWebsocket } from '../../../data/ws.hook';

export const useDesiredResources = () => {
  const [desiredResources, setResources] = useRecoilState(desiredResourceState);
  const [createState, setCreatingState] = useRecoilState(creatingState);
  const { validateField, validateNames, validateResourceRemoval, formErrors } =
    useResourceValidation();

  const websocket = useWebsocket();

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
  const isCreating = useMemo(
    () =>
      Object.keys(createState).some((id) =>
        isUninitialisedOrLoading(createState[id])
      ),
    [createState]
  );

  useEffect(() => {
    if (websocket.state === ItemState.Completed) {
      const ws = websocket.value;
      const handler = console.log;
      ws.addMessageHandler(handler);
      return () => ws.removeMessageHandler(handler);
    }
  }, [websocket]);

  const createDesiredState = useCallback(async () => {
    if (
      !resourceValues ||
      isCreating ||
      websocket.state !== ItemState.Completed
    ) {
      return;
    }

    const stateBody = {
      state: resourceValues.map((r) => ({
        _type: r.type,
        _name: r.name ?? getAnonymousName(r.type),
        ...transformFormValues(r.fieldData, {
          desiredResources: resourceValues,
        }),
      })),
    };

    setCreatingState(
      stateBody.state.reduce(
        (acc, res) => ({ ...acc, [res._name]: createUninitialised() }),
        {} as CreatingState
      )
    );

    const ws = websocket.value;
    ws.sendMessage({
      type: 'CreateState',
      body: stateBody,
    });
    fetch<StateCreateResponse>('/v1/state', {
      method: 'POST',
      body: JSON.stringify(stateBody),
    })
      .then((response) =>
        setCreatingState(
          response.createdState.reduce(
            (acc, res) => ({ ...acc, [res._name]: createCompleted(res) }),
            {} as CreatingState
          )
        )
      )
      .catch((error) =>
        setCreatingState(
          stateBody.state.reduce(
            (acc, res) => ({ ...acc, [res._name]: createErrored(error) }),
            {} as CreatingState
          )
        )
      );
  }, [fetch, resourceValues, isCreating, setCreatingState, websocket]);

  return {
    desiredResources,
    getDesiredResource,
    updateResource,
    deleteResource,
    addResource,
    createDesiredState,
    isCreating,
    creatingState: createState,
    formErrors,
  };
};
