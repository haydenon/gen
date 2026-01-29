import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import ws from 'ws';
import { v4 as uuid } from 'uuid';

import {
  Resource,
  PropertiesBase,
  GenerationResultError,
  Generator,
  ErasedDesiredState,
  GeneratorOptions,
  GenerationContext,
  Environment,
  PropertyMap,
  PropertyType,
  Type,
  PropertyDefinition,
} from '@haydenon/gen-core';
import {
  isStateRequest,
  StateRequest,
  StateItem,
} from './models/state-requests';
import {
  AIScenarioGeneratorPlugin,
  AIGenerationRequest,
} from './plugins/ai-plugin.interface';
import {
  ScenarioLibraryPlugin,
  SavedScenario,
  ScenarioData,
} from './plugins/scenario-library-plugin.interface';
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
import {
  CreateServerMessage,
  CreateStateClientTypes,
  CreateStateMessage,
  CreateStateServerTypes,
} from './messages/create-state';
import { loadTypeDocFile, ParsedTypeDoc } from './typedoc-loader';
import { populateDocumentationFromTypeDoc } from './typedoc-documentation';

export interface ServerOptions {
  port?: number;
  environments: Environment[];
  aiScenarioGeneratorPlugin?: AIScenarioGeneratorPlugin;
  scenarioLibraryPlugin?: ScenarioLibraryPlugin;
  typedocFile?: string;
}

const defaultOptions: Required<
  Omit<ServerOptions, 'environments' | 'aiScenarioGeneratorPlugin' | 'scenarioLibraryPlugin' | 'typedocFile'>
> = {
  port: 8000,
};

export class GenServer {
  private options: Required<Omit<ServerOptions, 'aiScenarioGeneratorPlugin' | 'scenarioLibraryPlugin' | 'typedocFile'>>;
  private mapper: DesiredStateMapper;
  private aiPlugin?: AIScenarioGeneratorPlugin;
  private scenarioLibraryPlugin?: ScenarioLibraryPlugin;
  private typedoc?: ParsedTypeDoc;

  constructor(
    private resources: Resource<PropertiesBase, PropertiesBase>[],
    serverOptions: ServerOptions
  ) {
    if (!serverOptions?.environments.length) {
      throw new Error('Must provide environment details for server');
    }
    this.options = { ...defaultOptions, ...(serverOptions || {}) };
    this.aiPlugin = serverOptions.aiScenarioGeneratorPlugin;
    this.scenarioLibraryPlugin = serverOptions.scenarioLibraryPlugin;
    this.mapper = getMapper(resources);

    // Load TypeDoc file if provided
    if (serverOptions.typedocFile) {
      try {
        this.typedoc = loadTypeDocFile(serverOptions.typedocFile);
        console.log(`Loaded TypeDoc from ${serverOptions.typedocFile}`);

        // Populate resource and property descriptions from TypeDoc
        populateDocumentationFromTypeDoc(resources, this.typedoc);
      } catch (err) {
        console.error(`Failed to load TypeDoc file: ${(err as Error).message}`);
        throw err;
      }
    }
  }

  private sendErrors(res: any, errors: Error[]) {
    res.status(400);
    res.send({
      errors: errors.map((e) => ({
        message: e.message,
      })),
    });
  }

  /**
   * Get resources with all their parent dependencies included
   */
  private getResourcesWithParents(
    resources: Resource<PropertyMap, PropertyMap>[]
  ): Resource<PropertyMap, PropertyMap>[] {
    const resourceSet = new Set(resources);
    const visited = new Set<Resource<PropertyMap, PropertyMap>>();

    const addResourceWithParents = (
      resource: Resource<PropertyMap, PropertyMap>
    ) => {
      if (visited.has(resource)) {
        return;
      }
      visited.add(resource);
      resourceSet.add(resource);

      // Get linked resources from inputs
      const linkedResourceNames = this.getLinkedResourceNames(resource.inputs);
      for (const name of linkedResourceNames) {
        const linkedResource = this.resources.find((r) => r.name === name);
        if (linkedResource) {
          addResourceWithParents(linkedResource);
        }
      }
    };

    resources.forEach(addResourceWithParents);
    return Array.from(resourceSet);
  }

  /**
   * Get all linked resource names from a property map
   */
  private getLinkedResourceNames(propertyMap: PropertyMap): string[] {
    const names: string[] = [];

    const extractFromType = (type: PropertyType): void => {
      switch (type.type) {
        case Type.Link:
          type.resources.forEach((r: any) => {
            if (r.name && !names.includes(r.name)) {
              names.push(r.name);
            }
          });
          break;
        case Type.Array:
        case Type.Nullable:
        case Type.Undefinable:
          extractFromType(type.inner);
          break;
        case Type.Complex:
          Object.values(type.fields).forEach(extractFromType);
          break;
      }
    };

    Object.values(propertyMap).forEach((prop: PropertyDefinition<any>) => {
      extractFromType(prop.type);
    });

    return names;
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
          socket.send(JSON.stringify(value))
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

    app.get('/v1/resource', (req, res) => {
      let selectedResources = this.resources;

      // Filter by resource names if provided
      if (req.query.resourceNames) {
        const names = (req.query.resourceNames as string).split(',');
        selectedResources = selectedResources.filter((r) =>
          names.includes(r.name)
        );
      }

      // Include parent resources if requested
      if (req.query.includeParentResources === 'true') {
        selectedResources = this.getResourcesWithParents(selectedResources);
      }

      const resourcesResponse = selectedResources.map(mapResourceToResponse);
      res.send({
        resources: resourcesResponse,
      });
    });

    app.get('/v1/environment', (_, res) => {
      res.send({
        environments: this.options.environments.map(({ name }) => ({
          name,
        })),
      });
    });

    app.post('/v1/state', async (req, res) => {
      const body = req.body;

      let environment: Environment | undefined;
      if ('environment' in body) {
        const environmentName = body.environment;
        environment = this.options.environments.find(
          (env) => env.name === environmentName
        );
      } else if (this.options.environments.length === 1) {
        environment = this.options.environments[0];
      }

      if (!environment) {
        res.status(400);
        res.send(
          createErrorResponse(
            `Invalid environment provided. Valid environments are: ${this.options.environments
              .map((e) => e.name)
              .join(', ')}.`
          )
        );
        return;
      }

      const resp = await this.handleStateCreation(body, {
        generationContext: { environment },
      });
      if (resp.success) {
        res.send(resp.body);
      } else {
        const status = resp.errorType === ErrorType.ClientError ? 400 : 500;
        res.status(status);
        res.send(createErrorResponse(resp.errors));
      }
    });

    app.post('/v1/generate-scenario', async (req, res) => {
      const { scenarioPrompt, environment: environmentName } = req.body;

      // Validate input
      if (!scenarioPrompt || typeof scenarioPrompt !== 'string') {
        res.status(400);
        res.send(
          createErrorResponse('scenarioPrompt is required and must be a string')
        );
        return;
      }

      if (!environmentName || typeof environmentName !== 'string') {
        res.status(400);
        res.send(
          createErrorResponse('environment is required and must be a string')
        );
        return;
      }

      // Check if AI plugin is registered
      if (!this.aiPlugin) {
        res.status(501);
        res.send(
          createErrorResponse(
            'AI scenario generation is not enabled on this server'
          )
        );
        return;
      }

      // Validate environment
      const environment = this.options.environments.find(
        (env) => env.name === environmentName
      );
      if (!environment) {
        res.status(400);
        res.send(
          createErrorResponse(
            `Invalid environment provided. Valid environments are: ${this.options.environments
              .map((e) => e.name)
              .join(', ')}.`
          )
        );
        return;
      }

      try {
        // Call AI plugin with raw resources (plugin builds its own prompt and converts as needed)
        const request: AIGenerationRequest = {
          scenarioPrompt,
          fullPrompt: '', // Plugin will build this
          availableResources: this.resources,
          environment: environmentName,
        };

        const response = await this.aiPlugin.generateScenario(request);

        res.send({
          resources: response.resources,
          errors: response.errors,
        });
      } catch (err) {
        const error = err as Error;
        res.status(500);
        res.send(createErrorResponse(error.message));
      }
    });

    // Scenario Library Endpoints

    // GET /v1/scenarios/status - Check if scenario library is enabled
    app.get('/v1/scenarios/status', (_, res) => {
      res.send({
        enabled: this.scenarioLibraryPlugin !== undefined,
      });
    });

    // POST /v1/scenarios - Save a new scenario
    app.post('/v1/scenarios', async (req, res) => {
      if (!this.scenarioLibraryPlugin) {
        res.status(501);
        res.send(
          createErrorResponse('Scenario library is not enabled on this server')
        );
        return;
      }

      const { title, description, scenario } = req.body;

      // Validate input
      if (!title || typeof title !== 'string') {
        res.status(400);
        res.send(createErrorResponse('title is required and must be a string'));
        return;
      }

      if (description !== undefined && typeof description !== 'string') {
        res.status(400);
        res.send(createErrorResponse('description must be a string'));
        return;
      }

      if (!scenario || typeof scenario !== 'object' || !Array.isArray(scenario.resources)) {
        res.status(400);
        res.send(
          createErrorResponse(
            'scenario is required and must be an object with a resources array'
          )
        );
        return;
      }

      try {
        const now = new Date().toISOString();
        const savedScenario: SavedScenario = {
          id: uuid(),
          title,
          description: description || '',
          createdAt: now,
          updatedAt: now,
          scenario: scenario as ScenarioData,
        };

        await this.scenarioLibraryPlugin.saveScenario(savedScenario);

        res.send({ id: savedScenario.id });
      } catch (err) {
        const error = err as Error;
        res.status(500);
        res.send(createErrorResponse(error.message));
      }
    });

    // GET /v1/scenarios - List scenarios with pagination
    app.get('/v1/scenarios', async (req, res) => {
      if (!this.scenarioLibraryPlugin) {
        res.status(501);
        res.send(
          createErrorResponse('Scenario library is not enabled on this server')
        );
        return;
      }

      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const pageSize = req.query.pageSize
        ? parseInt(req.query.pageSize as string, 10)
        : 20;

      if (isNaN(page) || page < 1) {
        res.status(400);
        res.send(createErrorResponse('page must be a positive integer'));
        return;
      }

      if (isNaN(pageSize) || pageSize < 1 || pageSize > 100) {
        res.status(400);
        res.send(
          createErrorResponse('pageSize must be a positive integer between 1 and 100')
        );
        return;
      }

      try {
        const result = await this.scenarioLibraryPlugin.listScenarios(
          page,
          pageSize
        );
        res.send(result);
      } catch (err) {
        const error = err as Error;
        res.status(500);
        res.send(createErrorResponse(error.message));
      }
    });

    // GET /v1/scenarios/:id - Get a specific scenario
    app.get('/v1/scenarios/:id', async (req, res) => {
      if (!this.scenarioLibraryPlugin) {
        res.status(501);
        res.send(
          createErrorResponse('Scenario library is not enabled on this server')
        );
        return;
      }

      const { id } = req.params;

      if (!id || typeof id !== 'string') {
        res.status(400);
        res.send(createErrorResponse('id is required and must be a string'));
        return;
      }

      try {
        const scenario = await this.scenarioLibraryPlugin.loadScenario(id);
        res.send(scenario);
      } catch (err) {
        const error = err as Error;
        if (error.message.includes('not found')) {
          res.status(404);
        } else {
          res.status(500);
        }
        res.send(createErrorResponse(error.message));
      }
    });

    // DELETE /v1/scenarios/:id - Delete a scenario
    app.delete('/v1/scenarios/:id', async (req, res) => {
      if (!this.scenarioLibraryPlugin) {
        res.status(501);
        res.send(
          createErrorResponse('Scenario library is not enabled on this server')
        );
        return;
      }

      const { id } = req.params;

      if (!id || typeof id !== 'string') {
        res.status(400);
        res.send(createErrorResponse('id is required and must be a string'));
        return;
      }

      try {
        await this.scenarioLibraryPlugin.deleteScenario(id);
        res.send({ success: true });
      } catch (err) {
        const error = err as Error;
        if (error.message.includes('not found')) {
          res.status(404);
        } else {
          res.status(500);
        }
        res.send(createErrorResponse(error.message));
      }
    });

    // PUT /v1/scenarios/:id - Update a scenario
    app.put('/v1/scenarios/:id', async (req, res) => {
      if (!this.scenarioLibraryPlugin) {
        res.status(501);
        res.send(
          createErrorResponse('Scenario library is not enabled on this server')
        );
        return;
      }

      const { id } = req.params;
      const { title, description, scenario } = req.body;

      // Validate input
      if (!id || typeof id !== 'string') {
        res.status(400);
        res.send(createErrorResponse('id is required and must be a string'));
        return;
      }

      if (!title || typeof title !== 'string') {
        res.status(400);
        res.send(createErrorResponse('title is required and must be a string'));
        return;
      }

      if (description !== undefined && typeof description !== 'string') {
        res.status(400);
        res.send(createErrorResponse('description must be a string'));
        return;
      }

      if (!scenario || typeof scenario !== 'object' || !Array.isArray(scenario.resources)) {
        res.status(400);
        res.send(
          createErrorResponse(
            'scenario is required and must be an object with a resources array'
          )
        );
        return;
      }

      try {
        // Load existing scenario to preserve createdAt
        const existing = await this.scenarioLibraryPlugin.loadScenario(id);

        const updatedScenario: SavedScenario = {
          id,
          title,
          description: description || '',
          createdAt: existing.createdAt, // Preserve original creation time
          updatedAt: new Date().toISOString(),
          scenario: scenario as ScenarioData,
        };

        await this.scenarioLibraryPlugin.updateScenario(updatedScenario);

        res.send({ success: true });
      } catch (err) {
        const error = err as Error;
        if (error.message.includes('not found')) {
          res.status(404);
        } else {
          res.status(500);
        }
        res.send(createErrorResponse(error.message));
      }
    });

    app.use(express.static(path.resolve(__dirname, './client')));
    app.get('/*', (req, res) => {
      res.sendFile(path.resolve(__dirname, './client/index.html'));
    });
  }

  private handleWebSocketMessage(body: string, send: (data: any) => void) {
    try {
      const message = JSON.parse(body) as ClientMessage;
      if (!message || !message.type || typeof message.type !== 'string') {
        send(
          createErrorResponse(
            "Invalid message body. Must be an object with a 'type' field."
          )
        );
        return;
      }

      const environment = this.options.environments.find(
        (env) => env.name === message.environment
      );
      if (!environment) {
        send(
          createErrorResponse(
            `Invalid environment provided. Valid environments are: ${this.options.environments
              .map((e) => e.name)
              .join(', ')}.`
          )
        );
        return;
      }

      switch (message.type) {
        case CreateStateClientTypes.CreateState:
          this.handleCreateMessage(message.body, { environment }, send);
          break;
      }
    } catch {
      send(
        createErrorResponse(
          "Invalid message body. Must be an object with a 'type' field."
        )
      );
    }
  }

  private async handleCreateMessage(
    body: StateRequest,
    context: GenerationContext,
    send: (data: CreateServerMessage) => void
  ) {
    const options: GeneratorOptions = {
      onErrored: (error) =>
        send({
          type: CreateStateServerTypes.ResourceCreateErrored,
          desiredState: mapDesiredStateToResponse(error.desired),
          error: error.message,
        }),
      onDesiredStatePlaned: (state) =>
        send({
          type: CreateStateServerTypes.StateCreationPlanned,
          desiredState: state.map(mapDesiredStateToResponse),
        }),
      onCreateStarting: (item) =>
        send({
          type: CreateStateServerTypes.ResourceCreateStarting,
          desiredState: mapDesiredStateToResponse(item),
        }),
      onCreateFinished: (item) =>
        send({
          type: CreateStateServerTypes.ResourceCreateFinished,
          createdState: mapResourceInstanceToResponse(item),
        }),
      generationContext: context,
    };
    const result = await this.handleStateCreation(body, options);
    if (result.success) {
      send({
        type: CreateStateServerTypes.StateCreationFinished,
        result: result.body,
      });
    } else {
      send({
        type: CreateStateServerTypes.StateCreationErrored,
        errors: result.errors,
      });
    }
  }

  private async handleStateCreation(
    body: any,
    options?: GeneratorOptions
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

    const generator = Generator.create(desired, options);
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

function createErrorResponse(
  errorMessages: string | string[] | Error | Error[]
): {
  errors: { message: string }[];
} {
  const mapError = (error: string | Error) => ({
    message: typeof error === 'string' ? error : error.message,
  });
  const errors =
    errorMessages instanceof Array
      ? errorMessages.map(mapError)
      : [mapError(errorMessages)];
  return {
    errors,
  };
}

export type ClientMessageType = CreateStateClientTypes;

export interface ClientMessageBase {
  type: ClientMessageType;
}

type ClientMessage = CreateStateMessage;

export type ServerMessageType = CreateStateServerTypes;

export interface ServerMessageBase {
  type: ServerMessageType;
}

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
