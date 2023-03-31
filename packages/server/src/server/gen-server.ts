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
import { isStateRequest, StateRequest } from './models/state-requests';
import {
  DesiredStateMapper,
  getContextForDesiredState,
  getMapper,
} from './mapping/desired-state.mapper';
import {
  mapDesiredStateToResponse,
  mapResourceInstanceToResponse,
  StateCreateResponse,
} from './models/state-responses';
import { mapResourceToResponse } from './mapping/resource.mapper';

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
      socket.on('message', (message) => {
        this.handleWebSocketMessage(message.toString('utf8'), (value) =>
          socket.send(value)
        );
      });
    });

    server.on('upgrade', (request, socket, head) => {
      if (request.url === '/v1') {
        wsServer.handleUpgrade(request, socket, head, (socket) => {
          wsServer.emit('connection', socket, request);
        });
      }
    });

    app.get('/v1/resource', (_, res) => {
      const resourcesResponse = this.resources.map(mapResourceToResponse);
      res.send({
        resources: resourcesResponse,
      });
    });

    app.post('/v1/state', async (req, res) => {
      const body = req.body;

      const resp = await this.handleStateCreation(body);
      if (resp.success) {
        res.send(resp.body);
      } else {
        const status = resp.errorType === ErrorType.ClientError ? 400 : 500;
        res.status(status);
        res.send({
          errors: resp.errors.map((err) => ({ message: err })),
        });
      }
    });
  }

  private handleWebSocketMessage(body: string, send: (data: string) => void) {
    try {
      const message = JSON.parse(body) as ClientMessage;
      if (!message || !message.type || typeof message.type !== 'string') {
        send('Error: invalid body');
        return;
      }

      switch (message.type) {
        case ClientMessageType.CreateState:
          this.handleCreateMessage(message.body, send);
          break;
      }
    } catch {
      send('Error: invalid body');
    }
  }

  private async handleCreateMessage(
    body: StateRequest,
    send: (data: string) => void
  ) {
    const result = await this.handleStateCreation(body);
    if (result.success) {
      send(JSON.stringify(result.body));
    } else {
      send(JSON.stringify(result.errors));
    }
  }

  private async handleStateCreation(
    body: any
  ): Promise<Response<StateCreateResponse>> {
    if (!isStateRequest(body)) {
      return createClientError('Invalid state body.');
    }

    const context = getContextForDesiredState(this.resources, body.state);
    if (context instanceof Array) {
      return createClientError(context.map((err) => err.message));
    }
    const mappedState = body.state.map((s) => this.mapper(s, context));
    const errors = mappedState.filter((s) => s instanceof Array) as Error[][];
    if (errors.length > 0) {
      return createClientError(errors.flat().map((err) => err.message));
    }

    const desired = mappedState as ErasedDesiredState[];

    const generator = Generator.create(desired);
    try {
      const { createdState, desiredState } = await generator.generateState();
      const response: StateCreateResponse = {
        createdState: createdState.map(mapResourceInstanceToResponse),
        desiredState: desiredState.map(mapDesiredStateToResponse),
      };
      return createSuccess(response);
    } catch (err) {
      const error = err as GenerationResultError;

      return createServerError(
        error.errors?.map((e) => e.message) ?? [error.message]
      );
    }
  }
}

enum ClientMessageType {
  CreateState = 'CreateState',
}

interface ClientMessageBase {
  type: ClientMessageType;
}

interface CreateStateMessage extends ClientMessageBase {
  type: ClientMessageType.CreateState;
  body: StateRequest;
}

type ClientMessage = CreateStateMessage;

function createSuccess<T>(body: T): SuccessResponse<T> {
  return { success: true, body };
}

function createClientError(message: string | string[]): ErrorResponse {
  return {
    success: false,
    errorType: ErrorType.ClientError,
    errors: typeof message === 'string' ? [message] : message,
  };
}

function createServerError(message: string | string[]): ErrorResponse {
  return {
    success: false,
    errorType: ErrorType.ServerError,
    errors: typeof message === 'string' ? [message] : message,
  };
}

enum ErrorType {
  ClientError,
  ServerError,
}

interface ErrorResponse {
  success: false;
  errorType: ErrorType;
  errors: string[];
}

interface SuccessResponse<T> {
  success: true;
  body: T;
}

type Response<T> = SuccessResponse<T> | ErrorResponse;
