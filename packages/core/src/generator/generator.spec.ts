import {
  createDesiredState,
  ErasedDesiredState,
} from '../resources/desired-state';
import {
  GenerationContext,
  GenerationError,
  GenerationResultError,
  Generator,
} from './generator';
import {
  MockResource,
  StallResource,
  DelayResource,
  ErrorResource,
  SubResource,
  PassThroughResource,
  ConsumerResource,
  DependsOnResource,
  DelayedPassThroughResource,
  WithoutDependsOnResource,
  DependsOnPassThroughResource,
} from '../../test/resources';
import { getRuntimeResourceValue } from '../resources/runtime-values';
import { isRuntimeValue } from '../resources/runtime-values/runtime-values';

const anyMockInputs = { boolean: true, text: 'hello', number: 3 };

const generationContext: GenerationContext = {
  environment: {
    name: 'testEnv',
    properties: {},
  },
};

let explicitReturnState: ErasedDesiredState[] | undefined;
jest.mock('./state-tree-generation/state-tree.generator.ts', () => ({
  fillInDesiredStateTree: jest
    .fn()
    .mockImplementation((state) => explicitReturnState ?? state),
}));

describe('Generator', () => {
  beforeEach(() => {
    explicitReturnState = undefined;
  });

  test('returns resolved promise when succeeding', async () => {
    // Arrange
    const successState = createDesiredState(MockResource, anyMockInputs);
    const desiredState: ErasedDesiredState[] = [successState];
    const generator = Generator.create(desiredState);

    // Act
    const result = await generator.generateState();

    // Assert
    expect(result).toStrictEqual({
      desiredState,
      createdState: [
        {
          desiredState: successState,
          outputs: {
            id: expect.any(Number),
            text: expect.any(String),
            number: expect.any(Number),
            boolean: expect.any(Boolean),
          },
        },
      ],
    });
  });

  [
    createDesiredState(ErrorResource, {}),
    createDesiredState(StallResource, {}),
  ].forEach((errorState) =>
    test('returns rejected promise when failing', async () => {
      // Arrange
      const desiredState: ErasedDesiredState[] = [errorState];
      const generator = Generator.create(desiredState);

      // Act
      const result = generator.generateState();

      // Assert
      await expect(result).rejects.toEqual(
        new GenerationResultError('Generation encountered errors', [])
      );
    })
  );

  test('still returns rejected promise when some resources are created and others error', async () => {
    // Arrange
    const errorState = createDesiredState(ErrorResource, {});
    const desiredState: ErasedDesiredState[] = [
      errorState,
      createDesiredState(MockResource, {}),
    ];
    const generator = Generator.create(desiredState);

    // Act
    const result = generator.generateState();

    // Assert
    await expect(result).rejects.toEqual(
      new GenerationResultError('Generation encountered errors', [])
    );
  });

  test('notifies plan for resources', async () => {
    // Arrange
    const successState = createDesiredState(MockResource, anyMockInputs);
    const errorState = createDesiredState(ErrorResource, {});
    const stallState = createDesiredState(StallResource, {});
    const desiredState: ErasedDesiredState[] = [
      successState,
      errorState,
      stallState,
    ];
    const onDesiredStatePlaned = jest.fn();
    const generator = Generator.create(desiredState, {
      onDesiredStatePlaned,
      generationContext,
    });

    // Act
    await generator.generateState().catch(() => undefined);

    // Assert
    expect(onDesiredStatePlaned).toHaveBeenCalledTimes(1);
  });

  test('notifies starting for all resources', async () => {
    // Arrange
    const successState = createDesiredState(MockResource, anyMockInputs);
    const errorState = createDesiredState(ErrorResource, {});
    const stallState = createDesiredState(StallResource, {});
    const desiredState: ErasedDesiredState[] = [
      successState,
      errorState,
      stallState,
    ];
    const onCreateStarting = jest.fn();
    const generator = Generator.create(desiredState, {
      onCreateStarting,
      generationContext,
    });

    // Act
    await generator.generateState().catch(() => undefined);

    // Assert
    expect(onCreateStarting).toHaveBeenCalledTimes(3);
    expect(onCreateStarting).toHaveBeenCalledWith(successState);
    expect(onCreateStarting).toHaveBeenCalledWith(errorState);
    expect(onCreateStarting).toHaveBeenCalledWith(stallState);
  });

  test('notifies successes when resources succeed', async () => {
    // Arrange
    const successState = createDesiredState(MockResource, anyMockInputs);
    const desiredState: ErasedDesiredState[] = [
      successState,
      createDesiredState(ErrorResource, {}),
      createDesiredState(StallResource, {}),
    ];
    const onCreateFinished = jest.fn();
    const generator = Generator.create(desiredState, {
      onCreateFinished,
      generationContext,
    });

    // Act
    await generator.generateState().catch(() => undefined);

    // Assert
    expect(onCreateFinished).toHaveBeenCalledTimes(1);
    expect(onCreateFinished).toHaveBeenCalledWith({
      desiredState: successState,
      outputs: {
        id: expect.any(Number),
        text: expect.any(String),
        number: expect.any(Number),
        boolean: expect.any(Boolean),
      },
    });
  });

  test('notifies errors when resources fail', async () => {
    // Arrange
    const stalledState = createDesiredState(StallResource, {});
    const errorState = createDesiredState(ErrorResource, {});
    const desiredState: ErasedDesiredState[] = [
      stalledState,
      errorState,
      createDesiredState(MockResource, {}),
    ];
    const onErrored = jest.fn();
    const generator = Generator.create(desiredState, {
      onErrored,
      generationContext,
    });

    // Act
    await generator.generateState().catch(() => undefined);

    // Assert
    expect(onErrored).toHaveBeenCalledTimes(2);
    expect(onErrored).toHaveBeenCalledWith(
      new GenerationError(
        new Error(
          `Creating desired state item '${stalledState.name}' of resource 'StallDefinition' timed out`
        ),
        stalledState
      )
    );
    expect(onErrored).toHaveBeenCalledWith(
      new GenerationError(new Error('Failed to create'), errorState)
    );
  });

  test('does not create valid child resources if parent resource fails to be created', async () => {
    // Arrange
    const errorState = createDesiredState(ErrorResource, {});
    const successState = createDesiredState(SubResource, {
      mockId: getRuntimeResourceValue(errorState, 'id'),
    });
    const desiredState: ErasedDesiredState[] = [errorState, successState];
    const onCreateFinished = jest.fn();
    const generator = Generator.create(desiredState, {
      onCreateFinished,
      generationContext,
    });

    // Act
    await generator.generateState().catch(() => undefined);

    // Assert
    expect(onCreateFinished).not.toHaveBeenCalled();
  });

  test('can handle creating many resources at once', async () => {
    // Arrange
    const count = 100;
    const state = [...new Array(count).keys()].map(() =>
      createDesiredState(DelayResource, {})
    );
    const generator = Generator.create(state);

    // Act
    const result = await generator.generateState();

    // Assert
    expect(result.createdState).toHaveLength(count);
  });

  test('creates the filled out state tree', async () => {
    // Arrange
    const successState = createDesiredState(MockResource, anyMockInputs);
    const subState = createDesiredState(SubResource, { mockId: 1 });
    explicitReturnState = [successState, subState];
    const desiredState: ErasedDesiredState[] = [successState];
    const generator = Generator.create(desiredState);

    // Act
    const result = await generator.generateState();

    // Assert
    expect(result.createdState).toHaveLength(2);
    const mockResource = result.createdState.find(
      (c) => c.desiredState.resource === MockResource
    );
    const subResource = result.createdState.find(
      (c) => c.desiredState.resource === SubResource
    );
    expect(mockResource).toEqual({
      desiredState: successState,
      outputs: {
        id: expect.any(Number),
        text: expect.any(String),
        number: expect.any(Number),
        boolean: expect.any(Boolean),
      },
    });
    expect(subResource).toEqual({
      desiredState: subState,
      outputs: {
        id: expect.any(Number),
        mockId: expect.any(Number),
      },
    });
  });

  test('correctly fills out runtime values', async () => {
    // Arrange
    const text = 'this is the mock value';
    const successState = createDesiredState(MockResource, { text });
    const subState = createDesiredState(SubResource, {
      mockId: getRuntimeResourceValue(successState, 'id'),
      text: getRuntimeResourceValue(successState, 'text'),
    });
    const desiredState: ErasedDesiredState[] = [successState, subState];
    const generator = Generator.create(desiredState);

    // Act
    const result = await generator.generateState();

    // Assert
    expect(result.createdState).toHaveLength(2);
    const subResource = result.createdState.find(
      (c) => c.desiredState.resource === SubResource
    );
    expect(subResource).toMatchObject({
      desiredState: subState,
      outputs: {
        text,
      },
    });
  });

  describe('processKnownOutputs', () => {
    test('replaces runtime value with static value for simple pass-through property', () => {
      // Arrange
      const staticValue = 'static-value';
      const passThroughState = createDesiredState(PassThroughResource, {
        value: staticValue,
      });
      const consumerState = createDesiredState(ConsumerResource, {
        consumedValue: getRuntimeResourceValue(passThroughState, 'value'),
      });
      const desiredState: ErasedDesiredState[] = [
        passThroughState,
        consumerState,
      ];

      // Act
      const generator = Generator.create(desiredState);

      // Assert - The runtime value should be replaced with the static value
      expect(consumerState.inputs.consumedValue).toBe(staticValue);
      expect(isRuntimeValue(consumerState.inputs.consumedValue)).toBe(false);
    });

    test('does not replace runtime value when output is not a pass-through', () => {
      // Arrange
      const mockState = createDesiredState(MockResource, {
        text: 'test',
        number: 42,
        boolean: true,
      });
      const subState = createDesiredState(SubResource, {
        mockId: getRuntimeResourceValue(mockState, 'id'),
      });
      const desiredState: ErasedDesiredState[] = [mockState, subState];

      // Act
      const generator = Generator.create(desiredState);

      // Assert - The runtime value should remain because 'id' is not a pass-through
      expect(isRuntimeValue(subState.inputs.mockId)).toBe(true);
    });

    test('handles chain of pass-throughs correctly', () => {
      // Arrange
      const staticValue = 'chained-value';
      const firstPassThrough = createDesiredState(PassThroughResource, {
        value: staticValue,
      });
      const secondPassThrough = createDesiredState(PassThroughResource, {
        value: getRuntimeResourceValue(firstPassThrough, 'value'),
      });
      const consumerState = createDesiredState(ConsumerResource, {
        consumedValue: getRuntimeResourceValue(secondPassThrough, 'value'),
      });
      const desiredState: ErasedDesiredState[] = [
        firstPassThrough,
        secondPassThrough,
        consumerState,
      ];

      // Act
      const generator = Generator.create(desiredState);

      // Assert - Both should be resolved to the static value
      expect(secondPassThrough.inputs.value).toBe(staticValue);
      expect(isRuntimeValue(secondPassThrough.inputs.value)).toBe(false);
      expect(consumerState.inputs.consumedValue).toBe(staticValue);
      expect(isRuntimeValue(consumerState.inputs.consumedValue)).toBe(false);
    });

    test('replaces runtime value for MockResource text property which is a pass-through', () => {
      // Arrange
      const staticText = 'test-text';
      const mockState = createDesiredState(MockResource, {
        text: staticText,
        number: 42,
        boolean: true,
      });
      const consumerState = createDesiredState(ConsumerResource, {
        consumedValue: getRuntimeResourceValue(mockState, 'text'),
      });
      const desiredState: ErasedDesiredState[] = [mockState, consumerState];

      // Act
      const generator = Generator.create(desiredState);

      // Assert - 'text' is a pass-through in MockResource (exists in both inputs and outputs)
      expect(consumerState.inputs.consumedValue).toBe(staticText);
      expect(isRuntimeValue(consumerState.inputs.consumedValue)).toBe(false);
    });

    test('resolves runtime value through pass-through even when input is runtime', () => {
      // Arrange
      const staticText = 'test';
      const mockState = createDesiredState(MockResource, {
        text: staticText,
        number: 42,
        boolean: true,
      });
      const passThroughState = createDesiredState(PassThroughResource, {
        value: getRuntimeResourceValue(mockState, 'text'),
      });
      const consumerState = createDesiredState(ConsumerResource, {
        consumedValue: getRuntimeResourceValue(passThroughState, 'value'),
      });
      const desiredState: ErasedDesiredState[] = [
        mockState,
        passThroughState,
        consumerState,
      ];

      // Act
      const generator = Generator.create(desiredState);

      // Assert - The chain should be fully resolved:
      // 1. mockState.text = 'test' (static, tracked as pass-through)
      // 2. passThroughState.value = runtime(mockState.text) -> replaced with 'test'
      // 3. passThroughState.value now tracked as pass-through with value 'test'
      // 4. consumerState.consumedValue = runtime(passThroughState.value) -> replaced with 'test'
      expect(passThroughState.inputs.value).toBe(staticText);
      expect(isRuntimeValue(passThroughState.inputs.value)).toBe(false);
      expect(consumerState.inputs.consumedValue).toBe(staticText);
      expect(isRuntimeValue(consumerState.inputs.consumedValue)).toBe(false);
    });

    test('pass-through replacement works end-to-end in generation', async () => {
      // Arrange
      const staticValue = 'e2e-test-value';
      const passThroughState = createDesiredState(PassThroughResource, {
        value: staticValue,
      });
      const consumerState = createDesiredState(ConsumerResource, {
        consumedValue: getRuntimeResourceValue(passThroughState, 'value'),
      });
      const desiredState: ErasedDesiredState[] = [
        passThroughState,
        consumerState,
      ];
      const generator = Generator.create(desiredState);

      // Act
      const result = await generator.generateState();

      // Assert
      expect(result.createdState).toHaveLength(2);
      const consumer = result.createdState.find(
        (c) => c.desiredState.resource === ConsumerResource
      );
      expect(consumer?.outputs.consumedValue).toBe(staticValue);
    });
  });

  describe('dependsOn() method', () => {
    test('without dependsOn, both resources start simultaneously when pass-through value is static', async () => {
      // Arrange
      const staticValue = 'test-value';
      const passThroughState = createDesiredState(DelayedPassThroughResource, {
        value: staticValue,
      });
      const withoutDependsOnState = createDesiredState(
        WithoutDependsOnResource,
        {
          passThroughValue: getRuntimeResourceValue(passThroughState, 'value'),
          text: 'without-depends-on-text',
        }
      );

      const desiredState: ErasedDesiredState[] = [
        passThroughState,
        withoutDependsOnState,
      ];

      const creationStartTimes: { [name: string]: number } = {};
      const creationFinishTimes: { [name: string]: number } = {};

      const generator = Generator.create(desiredState, {
        generationContext,
        onCreateStarting: (resource) => {
          creationStartTimes[resource.name] = Date.now();
        },
        onCreateFinished: (resource) => {
          creationFinishTimes[resource.desiredState.name] = Date.now();
        },
      });

      // Act
      const result = await generator.generateState();

      // Assert
      expect(result.createdState).toHaveLength(2);

      // After processKnownOutputs optimizes the static pass-through value away,
      // both resources should start at nearly the same time
      const passThroughStartTime =
        creationStartTimes[passThroughState.name] || 0;
      const withoutDependsOnStartTime =
        creationStartTimes[withoutDependsOnState.name] || 0;

      // Both should start within 5ms of each other (simultaneous)
      const startTimeDiff = Math.abs(
        passThroughStartTime - withoutDependsOnStartTime
      );
      expect(startTimeDiff).toBeLessThan(5);

      // WithoutDependsOn should finish first (it has 10ms delay vs 50ms)
      const passThroughFinishTime =
        creationFinishTimes[passThroughState.name] || 0;
      const withoutDependsOnFinishTime =
        creationFinishTimes[withoutDependsOnState.name] || 0;
      expect(withoutDependsOnFinishTime).toBeLessThan(passThroughFinishTime);
    });

    test('with dependsOn, dependent resource waits for dependency to finish before starting', async () => {
      // Arrange
      const passThroughState = createDesiredState(DelayedPassThroughResource, {
        value: 'test-value',
      });
      const dependsOnState = createDesiredState(DependsOnResource, {
        passThroughId: getRuntimeResourceValue(passThroughState, 'id'),
        text: 'depends-on-text',
      });

      const desiredState: ErasedDesiredState[] = [
        passThroughState,
        dependsOnState,
      ];

      const creationStartTimes: { [name: string]: number } = {};
      const creationFinishTimes: { [name: string]: number } = {};

      const generator = Generator.create(desiredState, {
        generationContext,
        onCreateStarting: (resource) => {
          creationStartTimes[resource.name] = Date.now();
        },
        onCreateFinished: (resource) => {
          creationFinishTimes[resource.desiredState.name] = Date.now();
        },
      });

      // Act
      const result = await generator.generateState();

      // Assert
      expect(result.createdState).toHaveLength(2);

      const passThroughStartTime =
        creationStartTimes[passThroughState.name] || 0;
      const passThroughFinishTime =
        creationFinishTimes[passThroughState.name] || 0;
      const dependsOnStartTime = creationStartTimes[dependsOnState.name] || 0;

      // Verify the dependency was declared
      expect(DependsOnResource.dependencies).toHaveLength(1);
      expect(DependsOnResource.dependencies[0].resource).toBe(
        DelayedPassThroughResource
      );

      // PassThrough should start first
      expect(passThroughStartTime).toBeLessThan(dependsOnStartTime);

      // DependsOn should NOT start until PassThrough finishes
      // PassThrough finishes at start + 50ms
      // DependsOn should start after that
      expect(dependsOnStartTime).toBeGreaterThanOrEqual(passThroughFinishTime);

      // Verify outputs are correct
      const passThrough = result.createdState.find(
        (c) => c.desiredState.resource === DelayedPassThroughResource
      );
      const dependsOn = result.createdState.find(
        (c) => c.desiredState.resource === DependsOnResource
      );
      expect(dependsOn?.outputs.passThroughId).toBe(passThrough?.outputs.id);
    });

    test('with dependsOn on pass-through, dependency preserved even with static value', async () => {
      // Arrange - Create with static value that would normally be optimized
      // This is the key difference: same setup as the first test, but with dependsOn()
      const staticValue = 'static-test-value';
      const passThroughState = createDesiredState(DelayedPassThroughResource, {
        value: staticValue,
      });
      const dependsOnState = createDesiredState(DependsOnPassThroughResource, {
        passThroughValue: getRuntimeResourceValue(passThroughState, 'value'),
        text: 'depends-on-text',
      });

      const desiredState: ErasedDesiredState[] = [
        passThroughState,
        dependsOnState,
      ];

      const creationStartTimes: { [name: string]: number } = {};
      const creationFinishTimes: { [name: string]: number } = {};

      const generator = Generator.create(desiredState, {
        generationContext,
        onCreateStarting: (resource) => {
          creationStartTimes[resource.name] = Date.now();
        },
        onCreateFinished: (resource) => {
          creationFinishTimes[resource.desiredState.name] = Date.now();
        },
      });

      // Act
      const result = await generator.generateState();

      // Assert
      expect(result.createdState).toHaveLength(2);

      const passThroughStartTime =
        creationStartTimes[passThroughState.name] || 0;
      const passThroughFinishTime =
        creationFinishTimes[passThroughState.name] || 0;
      const dependsOnStartTime = creationStartTimes[dependsOnState.name] || 0;

      // Verify the dependency was declared
      expect(DependsOnPassThroughResource.dependencies).toHaveLength(1);
      expect(DependsOnPassThroughResource.dependencies[0].resource).toBe(
        DelayedPassThroughResource
      );

      // Even though the pass-through has a static value, the explicit dependency
      // should be preserved (unlike the first test where it was optimized away)
      // PassThrough should start first
      expect(passThroughStartTime).toBeLessThan(dependsOnStartTime);

      // DependsOn should NOT start until PassThrough finishes
      expect(dependsOnStartTime).toBeGreaterThanOrEqual(passThroughFinishTime);

      // Verify outputs are correct
      const passThrough = result.createdState.find(
        (c) => c.desiredState.resource === DelayedPassThroughResource
      );
      const dependsOn = result.createdState.find(
        (c) => c.desiredState.resource === DependsOnPassThroughResource
      );
      expect(dependsOn?.outputs.passThroughValue).toBe(staticValue);
      expect(passThrough?.outputs.value).toBe(staticValue);
    });
  });
});
