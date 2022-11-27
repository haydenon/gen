import express from 'express';
import bodyParser from 'body-parser';
import ws from 'ws';

import {
  Resource,
  PropertiesBase,
  GenerationResultError,
  Generator,
  ErasedDesiredState,
} from '@haydenon/gen-core';
import { isStateRequest } from './models/state-requests';
import {
  DesiredStateMapper,
  getContextForDesiredState,
  getMapper,
} from './mapping/desired-state.mapper';
import {
  mapDesiredStateToResponse,
  mapResourceInstanceToResponse,
} from './models/state-responses';

interface ServerOptions {
  port?: number;
}

const defaultOptions: Required<ServerOptions> = {
  port: 8000,
};

export class GenServer {
  private options: Required<ServerOptions>;
  private mapper: DesiredStateMapper;

  constructor(
    private resources: Resource<PropertiesBase, PropertiesBase>[],
    serverOptions?: ServerOptions
  ) {
    this.options = { ...defaultOptions, ...(serverOptions || {}) };
    this.mapper = getMapper(resources);
  }

  private sendErrors(res: any, errors: Error[]) {
    res.status(400);
    res.send({
      errors: errors.map((e) => ({
        message: e.message,
      })),
    });
  }

  run() {
    const app = express();
    app.use(bodyParser.json());

    const port = this.options.port;
    const server = app.listen(port, () => {
      console.log('Running on port ' + port);
    });

    const wsServer = new ws.Server({ noServer: true });
    wsServer.on('connection', (socket) => {
      socket.on('message', (message) => console.log(message));
    });

    server.on('upgrade', (request, socket, head) => {
      console.log(request.url);
      if (request.url === '/v1') {
        wsServer.handleUpgrade(request, socket, head, (socket) => {
          wsServer.emit('connection', socket, request);
        });
      }
    });

    app.post('/v1/state', async (req, res) => {
      const body = req.body;
      if (!isStateRequest(body)) {
        res.status(400);
        res.send({
          errors: [{ message: 'Invalid state body.' }],
        });
        return;
      }

      const context = getContextForDesiredState(this.resources, body.state);
      if (context instanceof Array) {
        this.sendErrors(res, context);
        return;
      }
      const mappedState = body.state.map((s) => this.mapper(s, context));
      const errors = mappedState.filter((s) => s instanceof Array) as Error[][];
      if (errors.length > 0) {
        this.sendErrors(res, errors.flat());
        return;
      }

      const desired = mappedState as ErasedDesiredState[];

      const generator = Generator.create(desired);
      try {
        const { createdState, desiredState } = await generator.generateState();
        res.send({
          createdState: createdState.map(mapResourceInstanceToResponse),
          desiredState: desiredState.map(mapDesiredStateToResponse),
        });
      } catch (err) {
        const error = err as GenerationResultError;
        res.status(400);
        res.send({
          errors: [
            error.errors?.map((e) => ({
              messages: e.message,
            })) ?? { message: error.message },
          ],
        });
      }
    });
  }
}
