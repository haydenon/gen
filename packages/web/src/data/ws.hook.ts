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

const wsState = atom<Item<WebSocketClient>>({
  key: getKey(StateKey.WebSocket),
  default: createUninitialised(),
});

export const useWebsocket = () => {
  const [websocket, setWebsocket] = useRecoilState(wsState);

  useEffect(() => {
    if (websocket.state === ItemState.Uninitialised) {
      const handlers: ((payload: any) => void)[] = [];
      const createWebsocket = () => {
        /* eslint-disable no-restricted-globals */
        const isSecure = location.protocol.startsWith('https');
        const host = `${location.hostname}${
          location.port ? ':' + location.port : ''
        }`;
        /* eslint-enable no-restricted-globals */
        const protocol = isSecure ? 'wss' : 'ws';
        let ws: WebSocket | undefined = new WebSocket(
          `${protocol}://${host}/v1`
        );

        setWebsocket(createLoading());
        ws.addEventListener('open', () => {
          setWebsocket(
            createCompleted({
              sendMessage: (payload) => ws && ws.send(JSON.stringify(payload)),
              addMessageHandler: (handler) => handlers.push(handler),
              removeMessageHandler: (handler) => {
                const idx = handlers.indexOf(handler);
                if (idx !== -1) {
                  handlers.splice(idx, 1);
                }
              },
            } as WebSocketClient)
          );
        });

        // Listen for messages
        ws.addEventListener('message', (event) => {
          if (ws) {
            for (const handler of handlers) {
              handler(JSON.parse(event.data));
            }
          }
        });

        ws.addEventListener('close', () => {
          if (ws) {
            ws = undefined;
            setTimeout(createWebsocket, 5000);
          }
        });
      };

      createWebsocket();
    }
  }, [websocket, setWebsocket]);

  return websocket;
};

interface WebSocketClient {
  sendMessage: (payload: any) => void;
  addMessageHandler: <T>(handler: (payload: T) => void) => void;
  removeMessageHandler: <T>(handler: (payload: T) => void) => void;
}
