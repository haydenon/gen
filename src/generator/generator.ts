import { PropertyMap, PropertyValues } from '../resources/resource';
import {
  PropertyTypeVisitor,
  ArrayType,
  ComplexType,
  Nullable,
  Undefinable,
  acceptPropertyType,
  RuntimeValue,
  isRuntimeValue,
  CreatedState,
} from '../resources/properties';
import { ResourceInstance } from '../resources/instance';
import { DesiredState } from '../resources/desired-state';
import { fillInDesiredStateTree } from './state-tree-generation/state-tree.generator';

const DEFAULT_CREATE_TIMEOUT = 30 * 1000;

interface StateNode {
  state: DesiredState;
  depth: number;
  dependencies: StateNode[];
  depedendents: StateNode[];
  output?: ResourceInstance<PropertyMap>;
  error?: GenerationError;
}

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

class RuntimeValueFillVisitor implements PropertyTypeVisitor<any> {
  constructor(
    private value: any,
    private getRuntimeValue: (resourceLink: RuntimeValue<any>) => any
  ) {}

  private fillIfRuntime = () => {
    if (isRuntimeValue(this.value) && this.value) {
      return this.getRuntimeValue(this.value);
    }

    return this.value;
  };

  visitBool = this.fillIfRuntime;
  visitInt = this.fillIfRuntime;
  visitFloat = this.fillIfRuntime;
  visitDate = this.fillIfRuntime;
  visitStr = this.fillIfRuntime;
  visitArray = (type: ArrayType) => {
    if (isRuntimeValue(this.value)) {
      return this.getRuntimeValue(this.value);
    }

    const arr = this.value as any[];
    const innerType = type.inner;
    const result: any[] = arr.map((item) => {
      this.value = item;
      return acceptPropertyType(this, innerType);
    });
    this.value = arr;
    return result;
  };
  visitNull = (type: Nullable): any =>
    this.value === null ? null : acceptPropertyType(this, type.inner);
  visitUndefined = (type: Undefinable): any =>
    this.value === undefined ? undefined : acceptPropertyType(this, type.inner);
  visitComplex = (type: ComplexType) => {
    if (isRuntimeValue(this.value)) {
      return this.getRuntimeValue(this.value);
    }

    const fields = type.fields;
    const originalValue = this.value;
    const result = Object.keys(this.value).reduce((acc, key) => {
      this.value = originalValue[key];
      acc[key] = acceptPropertyType(this, fields[key]);
      return acc;
    }, {} as any);
    this.value = originalValue;
    return result;
  };
}

class RuntimeValueVisitor implements PropertyTypeVisitor<RuntimeValue<any>[]> {
  constructor(private value: any) {}

  private returnIfRuntimeValue = () =>
    isRuntimeValue(this.value) ? [this.value] : [];

  visitBool = this.returnIfRuntimeValue;
  visitInt = this.returnIfRuntimeValue;
  visitFloat = this.returnIfRuntimeValue;
  visitDate = this.returnIfRuntimeValue;
  visitStr = this.returnIfRuntimeValue;
  visitArray = (type: ArrayType) => {
    if (isRuntimeValue(this.value)) {
      return [this.value];
    }

    const arr = this.value as any[];
    const innerType = type.inner;
    const result: RuntimeValue<any>[] = arr.reduce((acc, item) => {
      this.value = item;
      return [
        ...acc,
        ...acceptPropertyType<RuntimeValue<any>[]>(this, innerType),
      ];
    }, [] as RuntimeValue<any>[]);
    this.value = arr;
    return result;
  };
  visitNull = (type: Nullable): RuntimeValue<any>[] =>
    this.value === null ? [] : acceptPropertyType(this, type.inner);
  visitUndefined = (type: Undefinable): RuntimeValue<any>[] =>
    this.value === undefined
      ? []
      : acceptPropertyType<RuntimeValue<any>[]>(this, type.inner);
  visitComplex = (type: ComplexType) => {
    if (isRuntimeValue(this.value)) {
      return [this.value];
    }

    const fields = type.fields;
    const originalValue = this.value;
    const result: RuntimeValue<any>[] = Object.keys(this.value).reduce(
      (acc, key) => {
        this.value = originalValue[key];
        return [
          ...acc,
          ...acceptPropertyType<RuntimeValue<any>[]>(this, fields[key]),
        ];
      },
      [] as RuntimeValue<any>[]
    );
    this.value = originalValue;
    return result;
  };
}

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
        .create(this.fillInRuntimeValues(state.inputs, state.resource.inputs))
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
    const dependentItems = runtimeValue.resourceOutputValues.map(
      (outputValues) => this.getNodeForState(outputValues.item)
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

    return runtimeValue.valueAccessor(createdState);
  };

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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    // TODO: Verify unique state names
    state = fillInDesiredStateTree(state);
    return new Generator(Generator.getStructure(state), options);
  }

  private getNodeForState = getNode(this.stateNodes);

  private static getStructure(stateValues: DesiredState[]): StateNode[] {
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
        for (const item of runtimeValues.flatMap((l) =>
          l.resourceOutputValues.map((out) => out.item)
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
