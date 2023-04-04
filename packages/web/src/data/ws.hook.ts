import { useMemo } from 'react';

export const useWebsocket = (
  path: string,
  messageHandler: <T>(payload: T) => void
) => {
  const socket = useMemo(() => {
    /* eslint-disable no-restricted-globals */
    const isSecure = location.protocol === 'https';
    const host = `${location.hostname}${
      location.port ? ':' + location.port : ''
    }`;
    const protocol = isSecure ? 'wss' : 'ws';
    return new WebSocket(`${protocol}://${host}${path}`);
  }, [path]);

  const websocket = useMemo(
    () =>
      new Promise<WebSocket>((res) => {
        socket.addEventListener('open', (event) => {
          res({
            sendMessage: (payload) => socket.send(JSON.stringify(payload)),
          });
        });

        // Listen for messages
        socket.addEventListener('message', (event) => {
          messageHandler(event.data);
        });
      }),
    [socket, messageHandler]
  );

  return websocket;
};

interface WebSocket {
  sendMessage: (payload: any) => void;
}
