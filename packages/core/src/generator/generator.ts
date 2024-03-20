import { PropertyMap, PropertyValues } from '../resources/resource';
import {
  ArrayType,
  ComplexType,
  CreatedState,
  PropertyType,
} from '../resources/properties/properties';
import { ErasedResourceInstance } from '../resources/instance';
import { DesiredState, ErasedDesiredState } from '../resources/desired-state';
import { fillInDesiredStateTree } from './state-tree-generation/state-tree.generator';
import {
  ValueAndPropertyVisitor,
  acceptPropertyType,
} from '../resources/properties/property-visitor';
import {
  isRuntimeValue,
  RuntimeValue,
} from '../resources/runtime-values/runtime-values';
import { Environment } from './environment';

const DEFAULT_CREATE_TIMEOUT = 30 * 1000;

interface StateNode {
  state: ErasedDesiredState;
  depth: number;
  dependencies: StateNode[];
  depedendents: StateNode[];
  output?: ErasedResourceInstance;
  error?: GenerationError;
}

const CONCURRENT_CREATIONS = 10;

export interface GenerationContext {
  environment: Environment
}

export interface GeneratorOptions {
  onDesiredStatePlaned?: (desiredResources: ErasedDesiredState[]) => void;
  onCreateStarting?: (resource: ErasedDesiredState) => void;
  onCreateFinished?: (resource: ErasedResourceInstance) => void;
  onErrored?: (error: GenerationError) => void;
  generationContext: GenerationContext;
}

const getNode =
  (stateNodes: StateNode[]) =>
  (state: ErasedDesiredState | string): StateNode => {
    const node = stateNodes.find((n) =>
      typeof state === 'string' ? n.state.name === state : n.state === state
    );
    if (!node) {
      throw new Error('No node for state');
    }
    return node;
  };

class RuntimeValueFillVisitor extends ValueAndPropertyVisitor<any> {
  constructor(
    value: any,
    private getRuntimeValue: (resourceLink: RuntimeValue<any>) => any
  ) {
    super(value);
  }

  private fillIfRuntime = (type: PropertyType, value: any) => {
    if (isRuntimeValue(value) && value) {
      return this.getRuntimeValue(value);
    }

    return value;
  };

  visitBoolValue = this.fillIfRuntime;
  visitIntValue = this.fillIfRuntime;
  visitFloatValue = this.fillIfRuntime;
  visitDateValue = this.fillIfRuntime;
  visitStrValue = this.fillIfRuntime;

  checkArrayValue = (type: ArrayType, value: any): [true, any] | [false] =>
    isRuntimeValue(value) ? [true, this.getRuntimeValue(value)] : [false];
  mapArrayValue = (type: ArrayType, values: any[]): any => values;

  mapNullValue = (): any => null;
  mapUndefinedValue = (): any => undefined;

  checkComplexValue = (type: ComplexType, value: any): [true, any] | [false] =>
    isRuntimeValue(value) ? [true, this.getRuntimeValue(value)] : [false];
  mapComplexValue = (type: ComplexType, value: { [props: string]: any }) =>
    value;

  protected onEnteringArrayValue = undefined;
  protected onExitingArrayValue = undefined;
  protected onEnteringComplexValue = undefined;
  protected onExitingComplexValue = undefined;
  protected mapLink = undefined;
}

class RuntimeValueVisitor extends ValueAndPropertyVisitor<RuntimeValue<any>[]> {
  constructor(value: any) {
    super(value);
  }

  private returnIfRuntimeValue = (_: PropertyType, value: any) =>
    isRuntimeValue(value) ? [value] : [];

  visitBoolValue = this.returnIfRuntimeValue;
  visitIntValue = this.returnIfRuntimeValue;
  visitFloatValue = this.returnIfRuntimeValue;
  visitDateValue = this.returnIfRuntimeValue;
  visitStrValue = this.returnIfRuntimeValue;

  checkArrayValue = (
    type: ArrayType,
    value: any
  ): [true, RuntimeValue<any>[]] | [false] =>
    isRuntimeValue(value) ? [true, [value]] : [false];
  mapArrayValue = (type: ArrayType, value: RuntimeValue<any>[][]) =>
    value.flat();

  mapNullValue = (): RuntimeValue<any>[] => [];
  mapUndefinedValue = (): RuntimeValue<any>[] => [];

  checkComplexValue = (
    type: ComplexType,
    value: any
  ): [true, RuntimeValue<any>[]] | [false] =>
    isRuntimeValue(value) ? [true, [value]] : [false];
  mapComplexValue = (
    type: ComplexType,
    value: { [prop: string]: RuntimeValue<any>[] }
  ) => Object.values(value).flat();

  protected onEnteringArrayValue = undefined;
  protected onExitingArrayValue = undefined;
  protected onEnteringComplexValue = undefined;
  protected onExitingComplexValue = undefined;
  protected mapLink = undefined;
}

interface GeneratedStateResponse {
  desiredState: ErasedDesiredState[];
  createdState: ErasedResourceInstance[];
}

export class Generator {
  private inProgressCount = 0;
  private queued: StateNode[] = [];
  private resolve: (results: GeneratedStateResponse) => void;
  private reject: (error: Error) => void;
  private promise: Promise<GeneratedStateResponse>;

  private desiredState: ErasedDesiredState[];

  private constructor(
    private stateNodes: StateNode[],
    private options?: GeneratorOptions
  ) {
    this.desiredState = stateNodes.map((n) => n.state);
    this.notifyItemsPlanned(this.desiredState);
    this.appendReadyNodesToQueue(stateNodes);
    this.resolve = () => {};
    this.reject = () => {};
    this.promise = new Promise((res, rej) => {
      this.resolve = res;
      this.reject = rej;
    });
  }

  async generateState(): Promise<GeneratedStateResponse> {
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
      this.notifyItemCreateStart(stateItem);
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
    state: ErasedDesiredState
  ): Promise<ErasedResourceInstance> {
    return new Promise((res, rej) => {
      const timeout =
        state.resource.createTimeoutMillis ?? DEFAULT_CREATE_TIMEOUT;
      const timerId = setTimeout(() => {
        rej(
          new Error(
            `Creating desired state item '${state.name}' of resource '${state.resource.name}' timed out`
          )
        );
      }, timeout);
      const created = state.resource
        .create(
          this.fillInRuntimeValues(state.inputs, state.resource.inputs),
          this.options?.generationContext
        )
        .then((outputs) => {
          const instance: ErasedResourceInstance = {
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

  private fillInRuntimeValues(
    inputs: Partial<PropertyValues<PropertyMap>>,
    definitions: PropertyMap
  ): PropertyValues<PropertyMap> {
    return Object.keys(definitions).reduce((acc, key) => {
      const runtimeFillVisitor = new RuntimeValueFillVisitor(
        inputs[key],
        this.getRuntimeValue
      );
      acc[key] = acceptPropertyType(runtimeFillVisitor, definitions[key].type);
      return acc;
    }, {} as PropertyValues<PropertyMap>);
  }

  private getRuntimeValue = (runtimeValue: RuntimeValue<any>): any => {
    const dependentItems = runtimeValue.depdendentStateNames.map(
      (outputValues) => this.getNodeForState(outputValues)
    );

    const createdState = dependentItems.reduce((acc, item) => {
      if (!item.output) {
        throw new Error('Dependent state should already be created');
      }
      acc[item.state.name] = {
        desiredState: item.state,
        createdState: item.output.outputs,
      };
      return acc;
    }, {} as CreatedState);

    return runtimeValue.evaluate(createdState);
  };

  private notifyItemsPlanned(stateItems: ErasedDesiredState[]) {
    if (this.options?.onDesiredStatePlaned) {
      try {
        this.options.onDesiredStatePlaned(stateItems);
      } catch {
        // Prevent consumer errors stopping the generator
      }
    }
  }

  private notifyItemCreateStart(stateItem: ErasedDesiredState) {
    if (this.options?.onCreateStarting) {
      try {
        this.options.onCreateStarting(stateItem);
      } catch {
        // Prevent consumer errors stopping the generator
      }
    }
  }

  private notifyItemSuccess(instance: ErasedResourceInstance) {
    if (this.options?.onCreateFinished) {
      try {
        this.options.onCreateFinished(instance);
      } catch {
        // Prevent consumer errors stopping the generator
      }
    }
  }

  private notifyItemError(error: Error, desired: ErasedDesiredState) {
    if (this.options?.onErrored) {
      try {
        this.options.onErrored(new GenerationError(error, desired));
      } catch {
        // Prevent consumer errors stopping the generator
      }
    }
  }

  private get anyInProgress(): boolean {
    return this.inProgressCount > 0;
  }

  private getNextForCreation(count: number): ErasedDesiredState[] {
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
      this.resolve({
        desiredState: this.desiredState,
        createdState: this.stateNodes.map(
          (n) => n.output as ErasedResourceInstance
        ),
      });
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private markCreating(_: ErasedDesiredState): void {
    this.inProgressCount++;
  }

  private markCreated(
    state: ErasedDesiredState,
    output: ErasedResourceInstance
  ): void {
    const node = this.stateNodes.find((n) => n.state === state);
    if (!node) {
      throw new Error('Node does not exist');
    }

    node.output = output;
    this.inProgressCount--;
    this.appendReadyNodesToQueue(node.depedendents);
  }

  private markFailed(state: ErasedDesiredState, error: Error): void {
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

  static create(
    state: ErasedDesiredState[],
    options?: GeneratorOptions
  ): Generator {
    // TODO: Verify unique state names
    state = fillInDesiredStateTree(state);
    return new Generator(Generator.getStructure(state), options);
  }

  private getNodeForState = getNode(this.stateNodes);

  private static getStructure(stateValues: ErasedDesiredState[]): StateNode[] {
    const nodes: StateNode[] = stateValues.map((state) => ({
      state,
      depth: 0,
      created: false,
      dependencies: [],
      depedendents: [],
    }));

    for (const node of nodes) {
      for (const inputKey of Object.keys(node.state.resource.inputs)) {
        const inputDef = node.state.resource.inputs[inputKey];
        const resourceLinkVisitor = new RuntimeValueVisitor(
          node.state.inputs[inputKey]
        );
        const runtimeValues = acceptPropertyType<RuntimeValue<any>[]>(
          resourceLinkVisitor,
          inputDef.type
        );
        for (const item of runtimeValues.flatMap(
          (l) => l.depdendentStateNames
        )) {
          const runtimeValueNode = getNode(nodes)(item);
          node.dependencies.push(runtimeValueNode);
          runtimeValueNode.depedendents.push(node);
        }
      }
    }

    return nodes;
  }
}

export class GenerationError extends Error {
  constructor(public inner: Error, public desired: ErasedDesiredState) {
    super(inner.message);
  }
}

export class GenerationResultError extends Error {
  constructor(message: string, public errors?: GenerationError[]) {
    super(message);
  }
}
