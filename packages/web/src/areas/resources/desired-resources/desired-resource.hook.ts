import { useCallback, useEffect, useMemo } from 'react';
import { useRecoilState } from 'recoil';
import {
  createCompleted,
  createErrored,
  createLoading,
  createUninitialised,
  ItemState,
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
import {
  CreateServerMessage,
  CreateStateMessage,
  CreateStateServerTypes,
} from '@haydenon/gen-server';
import { getAnonymousName } from '@haydenon/gen-core';
import { useWebsocket } from '../../../data/ws.hook';

class ResourceCreationError extends Error {
  constructor(message: string, public errors: string[]) {
    super(message);
  }
}

export const useDesiredResources = () => {
  const [desiredResources, setResources] = useRecoilState(desiredResourceState);
  const [createState, setCreatingState] = useRecoilState(creatingState);
  const { validateField, validateNames, validateResourceRemoval, formErrors } =
    useResourceValidation();

  const websocket = useWebsocket();

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
    () => createState.requestState.state === ItemState.Loading,
    [createState]
  );

  type CreateStateTypeValues = `${CreateStateServerTypes}`;

  useEffect(() => {
    if (websocket.state === ItemState.Completed) {
      const ws = websocket.value;
      const validMessages: CreateStateTypeValues[] = [
        'StatePlanned',
        'ResourceCreateStarting',
        'ResourceCreateErrored',
        'ResourceCreateFinished',
        'StateCreationFinished',
        'StateCreationErrored',
      ];
      const isCreateMessage = (message: any): message is CreateServerMessage =>
        message && message.type && validMessages.includes(message.type);
      const handler = (message: any) => {
        if (!isCreateMessage(message)) {
          return;
        }

        switch (message.type) {
          case 'StatePlanned':
            setCreatingState({
              ...createState,
              resources: message.desiredState.reduce(
                (acc, res) => ({ ...acc, [res._name]: createUninitialised() }),
                {} as CreatingState['resources']
              ),
            });
            break;
          case 'ResourceCreateStarting':
            setCreatingState({
              ...createState,
              resources: {
                ...createState.resources,
                [message.desiredState._name]: createLoading(),
              },
            });
            break;
          case 'ResourceCreateErrored':
            setCreatingState({
              ...createState,
              resources: {
                ...createState.resources,
                [message.desiredState._name]: createErrored(
                  new Error(message.error)
                ),
              },
            });
            break;
          case 'ResourceCreateFinished':
            setCreatingState({
              ...createState,
              resources: {
                ...createState.resources,
                [message.createdState._name]: createCompleted(
                  message.createdState
                ),
              },
            });
            break;
          case 'StateCreationFinished':
            setCreatingState({
              requestState: createCompleted(undefined),
              resources: message.result.createdState.reduce(
                (acc, res) => ({ ...acc, [res._name]: createCompleted(res) }),
                {} as CreatingState['resources']
              ),
            });
            break;
          case 'StateCreationErrored': {
            if (process.env.NODE_ENV !== 'production') {
              console.error(
                'Encountered errors on state creation',
                message.errors
              );
            }
            setCreatingState({
              ...createState,
              requestState: createErrored(
                new ResourceCreationError(
                  'Create state request failed',
                  message.errors
                )
              ),
            });
            break;
          }
        }
      };
      ws.addMessageHandler(handler);
      return () => ws.removeMessageHandler(handler);
    }
  }, [websocket, setCreatingState, createState]);

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
        _name: r.name?.trim() ?? getAnonymousName(r.type),
        ...transformFormValues(r.fieldData, {
          desiredResources: resourceValues,
        }),
      })),
    };

    setCreatingState({
      requestState: createLoading(),
      resources: stateBody.state.reduce(
        (acc, res) => ({ ...acc, [res._name]: createUninitialised() }),
        {} as CreatingState['resources']
      ),
    });

    const ws = websocket.value;
    // TODO:
    ws.sendMessage({
      type: 'CreateState',
      body: stateBody,
    } as CreateStateMessage);
    // fetch<StateCreateResponse>('/v1/state', {
    //   method: 'POST',
    //   body: JSON.stringify(stateBody),
    // })
    //   .then((response) =>
    //     setCreatingState(
    //       response.createdState.reduce(
    //         (acc, res) => ({ ...acc, [res._name]: createCompleted(res) }),
    //         {} as CreatingState
    //       )
    //     )
    //   )
    //   .catch((error) =>
    //     setCreatingState(
    //       stateBody.state.reduce(
    //         (acc, res) => ({ ...acc, [res._name]: createErrored(error) }),
    //         {} as CreatingState
    //       )
    //     )
    //   );
  }, [resourceValues, isCreating, setCreatingState, websocket]);

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
