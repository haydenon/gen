import { useEffect } from 'react';

import { atom, useRecoilState } from 'recoil';

import {
  createCompleted,
  createLoading,
  createUninitialised,
  getKeyGenerator,
  Item,
  ItemState,
  StateNamespace,
} from '.';

export enum StateKey {
  WebSocket = 'WebSocket',
}

const getKey = getKeyGenerator(StateNamespace.Resource);

const wsState = atom<Item<WebSocket>>({
  key: getKey(StateKey.WebSocket),
  default: createUninitialised(),
});

export const useWebsocket = () => {
  const [websocket, setWebsocket] = useRecoilState(wsState);

  useEffect(() => {
    if (websocket.state === ItemState.Uninitialised) {
      /* eslint-disable no-restricted-globals */
      const isSecure = location.protocol === 'https';
      const host = `${location.hostname}${
        location.port ? ':' + location.port : ''
      }`;
      /* eslint-enable no-restricted-globals */
      const protocol = isSecure ? 'wss' : 'ws';
      const ws = new WebSocket(`${protocol}://${host}/v1`);

      const handlers: ((payload: any) => void)[] = [];
      setWebsocket(createLoading());
      ws.addEventListener('open', () => {
        setWebsocket(
          createCompleted({
            sendMessage: (payload) => ws.send(JSON.stringify(payload)),
            addMessageHandler: (handler) => handlers.push(handler),
            removeMessageHandler: (handler) => {
              const idx = handlers.indexOf(handler);
              if (idx !== -1) {
                handlers.splice(idx, 1);
              }
            },
          } as WebSocket)
        );
      });

      // Listen for messages
      ws.addEventListener('message', (event) => {
        for (const handler of handlers) {
          handler(event.data);
        }
      });
    }
  }, [websocket, setWebsocket]);

  return websocket;
};

interface WebSocket {
  sendMessage: (payload: any) => void;
  addMessageHandler: <T>(handler: (payload: T) => void) => void;
  removeMessageHandler: <T>(handler: (payload: T) => void) => void;
}
