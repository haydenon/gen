import {
  ResourceInstance,
  PropertyMap,
  PropertyValues,
  PropertyType,
  PropertyTypeForValue,
  isNullable,
  isUndefinable,
  isArray,
  isComplex,
  isLinkType,
} from '../resources';
import { DesiredState } from '../resources/desired-state';
import { fillInDesiredStateTree } from './property-generation';

const DEFAULT_CREATE_TIMEOUT = 30 * 1000;

interface StateNode {
  state: DesiredState;
  depth: number;
  dependencies: StateNode[];
  depedendents: StateNode[];
  output?: ResourceInstance<PropertyMap>;
  error?: GenerationError;
}

export class ResourceLink {
  constructor(
    public item: DesiredState,
    public outputAccessor: (outputs: PropertyValues<PropertyMap>) => any
  ) {}
}
export const isResourceLink = (value: any): value is ResourceLink =>
  value instanceof ResourceLink;

const CONCURRENT_CREATIONS = 10;

interface GeneratorOptions {
  onCreate?: (resource: ResourceInstance<PropertyMap>) => void;
  onError?: (error: GenerationError) => void;
}

const getNode =
  (stateNodes: StateNode[]) =>
  (state: DesiredState): StateNode => {
    const node = stateNodes.find((n) => n.state === state);
    if (!node) {
      throw new Error('No node for state');
    }
    return node;
  };

export class Generator {
  private inProgressCount = 0;
  private queued: StateNode[] = [];
  private resolve: (results: ResourceInstance<PropertyMap>[]) => void;
  private reject: (error: Error) => void;
  private promise: Promise<ResourceInstance<PropertyMap>[]>;

  private constructor(
    private stateNodes: StateNode[],
    private options?: GeneratorOptions
  ) {
    this.appendReadyNodesToQueue(stateNodes);
    this.resolve = () => {};
    this.reject = () => {};
    this.promise = new Promise((res, rej) => {
      this.resolve = res;
      this.reject = rej;
    });
  }

  async generateState(): Promise<ResourceInstance<PropertyMap>[]> {
    this.runRound();
    return this.promise;
  }

  private runRound(): void {
    // TODO: Determine when finished
    const toCreate = this.getNextForCreation(CONCURRENT_CREATIONS);
    if (toCreate.length <= 0) {
      if (!this.anyInProgress) {
        this.completeGeneration();
      }
      return;
    }

    for (const stateItem of toCreate) {
      this.markCreating(stateItem);
      this.createDesiredState(stateItem)
        .then((instance) => {
          this.notifyItemSuccess(instance);
          this.markCreated(stateItem, instance);
          this.runRound();
        })
        .catch((err: Error) => {
          this.markFailed(stateItem, err);
          this.notifyItemError(err, stateItem);
          this.runRound();
        });
    }
  }

  private async createDesiredState(
    state: DesiredState
  ): Promise<ResourceInstance<PropertyMap>> {
    return new Promise((res, rej) => {
      const timeout =
        state.resource.createTimeoutMillis ?? DEFAULT_CREATE_TIMEOUT;
      const timerId = setTimeout(() => {
        rej(
          new Error(
            `Creating desired state item '${state.name}' of resource '${state.resource.constructor.name}' timed out`
          )
        );
      }, timeout);
      const created = state.resource
        .create(this.fillInLinks(state.inputs, state.resource.inputs))
        .then((outputs) => {
          const instance: ResourceInstance<PropertyMap> = {
            desiredState: state,
            outputs,
          };
          clearTimeout(timerId);
          res(instance);
        })
        .catch((err) => {
          clearTimeout(timerId);
          rej(err);
        });
      return created;
    });
  }

  private fillInLinks(
    inputs: Partial<PropertyValues<PropertyMap>>,
    definitions: PropertyMap
  ): PropertyValues<PropertyMap> {
    const fillInLinkForType = (type: PropertyType, value: any): any => {
      if (isComplex(type)) {
        const fields = type.fields;
        return Object.keys(value).reduce((acc, key) => {
          acc[key] = fillInLinkForType(fields[key], value[key]);
          return acc;
        }, {} as any);
      }
      if (isArray(type)) {
        const arr = value as any[];
        const innerType = type.inner;
        return arr.map((item) => fillInLinkForType(innerType, item));
      }

      while (isNullable(type) || isUndefinable(type)) {
        if (value === null) {
          return null;
        } else if (value === undefined) {
          return undefined;
        } else {
          type = type.inner;
        }
      }

      if (isLinkType(type) && isResourceLink(value)) {
        return this.getLinkValue(value);
      }

      return value;
    };

    return Object.keys(definitions).reduce((acc, key) => {
      acc[key] = fillInLinkForType(definitions[key].type, inputs[key]);
      return acc;
    }, {} as PropertyValues<PropertyMap>);
  }

  private getLinkValue(resourceLink: ResourceLink): any {
    const linkedValue = this.getNodeForState(resourceLink.item);
    if (!linkedValue.output) {
      throw new Error('Dependent state should already be created');
    }

    return resourceLink.outputAccessor(linkedValue.output.outputs);
  }

  private notifyItemSuccess(instance: ResourceInstance<PropertyMap>) {
    if (this.options?.onCreate) {
      try {
        this.options.onCreate(instance);
      } catch {
        // Prevent consumer errors stopping the generator
      }
    }
  }

  private notifyItemError(error: Error, desired: DesiredState) {
    if (this.options?.onError) {
      try {
        this.options.onError(new GenerationError(error, desired));
      } catch {
        // Prevent consumer errors stopping the generator
      }
    }
  }

  private get anyInProgress(): boolean {
    return this.inProgressCount > 0;
  }

  private getNextForCreation(count: number): DesiredState[] {
    const toFetch = count - this.inProgressCount;
    if (toFetch <= 0) {
      return [];
    }

    const upNext = this.queued.splice(0, count);
    return upNext.map(({ state }) => state);
  }

  private completeGeneration(): void {
    const [numCompleted, numErrored, total] = this.stateNodes.reduce(
      ([comp, err, tot], node) => [
        comp + (node.output ? 1 : 0),
        err + (node.error ? 1 : 0),
        tot + 1,
      ],
      [0, 0, 0] as [number, number, number]
    );
    if (numErrored > 0) {
      const errors = this.stateNodes
        .map((n) => n.error as GenerationError)
        .filter((n) => n);
      this.reject(
        new GenerationResultError('Generation encountered errors', errors)
      );
    } else if (numCompleted < total) {
      this.reject(new GenerationResultError('Generation stalled'));
    } else {
      this.resolve(
        this.stateNodes.map((n) => n.output as ResourceInstance<PropertyMap>)
      );
    }
  }

  private markCreating(_: DesiredState): void {
    this.inProgressCount++;
  }

  private markCreated(
    state: DesiredState,
    output: ResourceInstance<PropertyMap>
  ): void {
    const node = this.stateNodes.find((n) => n.state === state);
    if (!node) {
      throw new Error('Node does not exist');
    }

    node.output = output;
    this.inProgressCount--;
    this.appendReadyNodesToQueue(node.depedendents);
  }

  private markFailed(state: DesiredState, error: Error): void {
    const node = this.stateNodes.find((n) => n.state === state);
    if (!node) {
      throw new Error('Node does not exist');
    }

    node.error =
      error instanceof GenerationError
        ? error
        : new GenerationError(error, state);
    this.inProgressCount--;
  }

  private appendReadyNodesToQueue(nodes: StateNode[]): void {
    const ready = nodes.filter(
      (n) =>
        !n.output &&
        n.dependencies.every((dep) => dep.output) &&
        !this.queued.includes(n)
    );

    // TODO: Proper priority
    this.queued = this.queued
      .concat(ready)
      .sort((n1, n2) => n1.depth - n2.depth);
  }

  static create(state: DesiredState[], options?: GeneratorOptions): Generator {
    state = fillInDesiredStateTree(state);
    return new Generator(Generator.getStructure(state), options);
  }

  private getNodeForState = getNode(this.stateNodes);

  // TODO: Proper tree construction
  private static getStructure(stateValues: DesiredState[]): StateNode[] {
    const nodes: StateNode[] = stateValues.map((state) => ({
      state,
      depth: 0,
      created: false,
      dependencies: [],
      depedendents: [],
    }));

    for (const node of nodes) {
      for (const linkProp of Object.values(node.state.inputs).filter((v) =>
        isResourceLink(v)
      )) {
        const link = linkProp as any as ResourceLink;
        const linkNode = getNode(nodes)(link.item);
        node.dependencies.push(linkNode);
        linkNode.depedendents.push(node);
      }
    }

    return nodes;
  }
}

export class GenerationError extends Error {
  constructor(public inner: Error, public desired: DesiredState) {
    super();
    this.message = `Failed to create state: ${inner.message}`;
  }
}

export class GenerationResultError extends Error {
  constructor(message: string, public errors?: GenerationError[]) {
    super(message);
  }
}
