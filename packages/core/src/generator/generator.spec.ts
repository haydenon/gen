import {
  createDesiredState,
  ErasedDesiredState,
} from '../resources/desired-state';
import { GenerationError, GenerationResultError, Generator } from './generator';
import {
  MockResource,
  StallResource,
  DelayResource,
  ErrorResource,
  SubResource,
} from '../../test/resources';
import { getRuntimeResourceValue } from '../resources/runtime-values';

const anyMockInputs = { boolean: true, text: 'hello', number: 3 };

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
    const generator = Generator.create(desiredState, { onDesiredStatePlaned });

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
    const generator = Generator.create(desiredState, { onCreateStarting });

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
    const generator = Generator.create(desiredState, { onCreateFinished });

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
    const generator = Generator.create(desiredState, { onErrored });

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
    const generator = Generator.create(desiredState, { onCreateFinished });

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
});
