import { InputMap, Resource, ResourceInstance, OutputMap } from '../resources';
import { DesiredState } from '../resources/desired-state';

type Desired = DesiredState<InputMap, Resource<InputMap, OutputMap>>;

interface StateNode {
  state: Desired;
  depth: number;
  dependencies: StateNode[];
  depedendents: StateNode[];
  output?: ResourceInstance<OutputMap>;
  error?: GenerationError;
}

class GeneratorState {
  private inProgressCount = 0;
  private queued: StateNode[] = [];

  private constructor(
    private stateNodes: StateNode[],
    public resolve: (results: ResourceInstance<OutputMap>[]) => void,
    public reject: (error: Error) => void,
    public options: GeneratorOptions
  ) {
    this.appendReadyNodesToQueue(stateNodes);
  }

  get anyInProgress(): boolean {
    return this.inProgressCount > 0;
  }

  getNextForCreation(count: number): Desired[] {
    const toFetch = count - this.inProgressCount;
    if (toFetch <= 0) {
      return [];
    }

    const upNext = this.queued.splice(0, count);
    return upNext.map(({ state }) => state);
  }

  completeGeneration(): void {
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
        this.stateNodes.map((n) => n.output as ResourceInstance<OutputMap>)
      );
    }
  }

  markCreating(_: Desired): void {
    this.inProgressCount++;
  }

  markCreated(state: Desired, output: ResourceInstance<OutputMap>): void {
    const node = this.stateNodes.find((n) => n.state === state);
    if (!node) {
      throw new Error('Node does not exist');
    }

    node.output = output;
    this.inProgressCount--;
    this.appendReadyNodesToQueue(node.depedendents);
  }

  markFailed(state: Desired, error: Error): void {
    const node = this.stateNodes.find((n) => n.state === state);
    if (!node) {
      throw new Error('Node does not exist');
    }

    node.error = new GenerationError(error, state);
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

  static create(
    state: Desired[],
    [resolve, reject]: [
      (results: ResourceInstance<OutputMap>[]) => void,
      (error: Error) => void
    ],
    options: GeneratorOptions
  ): GeneratorState {
    return new GeneratorState(
      GeneratorState.getStructure(state),
      resolve,
      reject,
      options
    );
  }

  // TODO: Proper tree construction
  private static getStructure(stateValues: Desired[]): StateNode[] {
    return stateValues.map((state) => ({
      state,
      depth: 0,
      created: false,
      dependencies: [],
      depedendents: [],
    }));
  }
}

const CONCURRENT_CREATIONS = 10;

interface GeneratorOptions {
  onCreate?: (resource: ResourceInstance<OutputMap>) => void;
  onError?: (error: GenerationError) => void;
}

export class Generator {
  constructor(private resources: Resource<InputMap, OutputMap>[]) {}

  async generateState(
    state: DesiredState<InputMap, Resource<InputMap, OutputMap>>[],
    options?: GeneratorOptions
  ): Promise<ResourceInstance<OutputMap>[]> {
    return new Promise((res, rej) => {
      const generatorState = GeneratorState.create(
        state,
        [res, rej],
        options ?? {}
      );
      this.runRound(generatorState);
    });
  }

  private runRound(generatorState: GeneratorState): void {
    // TODO: Determine when finished
    const toCreate = generatorState.getNextForCreation(CONCURRENT_CREATIONS);
    if (toCreate.length <= 0) {
      if (!generatorState.anyInProgress) {
        generatorState.completeGeneration();
      }
      return;
    }

    for (const stateItem of toCreate) {
      generatorState.markCreating(stateItem);
      this.createDesiredState(stateItem)
        .then((instance) => {
          this.notifyItemSuccess(generatorState, instance);
          generatorState.markCreated(stateItem, instance);
          this.runRound(generatorState);
        })
        .catch((err: Error) => {
          this.notifyItemError(generatorState, err, stateItem);
        });
    }
  }

  private async createDesiredState(
    state: Desired
  ): Promise<ResourceInstance<OutputMap>> {
    const created = await state.resource.create(state.values);
    return created;
  }

  private notifyItemSuccess(
    generatorState: GeneratorState,
    instance: ResourceInstance<OutputMap>
  ) {
    if (generatorState.options.onCreate) {
      try {
        generatorState.options.onCreate(instance);
      } catch {
        // Prevent consumer errors stopping the generator
      }
    }
  }

  private notifyItemError(
    generatorState: GeneratorState,
    error: Error,
    desired: Desired
  ) {
    if (generatorState.options.onError) {
      try {
        generatorState.options.onError(new GenerationError(error, desired));
      } catch {
        // Prevent consumer errors stopping the generator
      }
    }
  }
}

export class GenerationError extends Error {
  constructor(public inner: Error, public desired: Desired) {
    super();
    this.message = `Failed to create state: ${inner.message}`;
  }
}

export class GenerationResultError extends Error {
  constructor(message: string, public errors?: GenerationError[]) {
    super(message);
  }
}
