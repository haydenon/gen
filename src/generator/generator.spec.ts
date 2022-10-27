import { createDesiredState, DesiredState } from '../resources/desired-state';
import { GenerationError, GenerationResultError, Generator } from './generator';
import {
  MockResource,
  StallResource,
  DelayResource,
  ErrorResource,
  SubResource,
} from '../../test/resources';

const anyMockInputs = { boolean: true, text: 'hello', number: 3 };

let explicitReturnState: DesiredState[] | undefined;
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
    const desiredState: DesiredState[] = [successState];
    const generator = Generator.create(desiredState);

    // Act
    const result = await generator.generateState();

    // Assert
    expect(result).toStrictEqual([
      {
        desiredState: successState,
        outputs: {
          id: expect.any(Number),
          text: expect.any(String),
          number: expect.any(Number),
          boolean: expect.any(Boolean),
        },
      },
    ]);
  });

  [
    createDesiredState(ErrorResource, {}),
    createDesiredState(StallResource, {}),
  ].forEach((errorState) =>
    test('returns rejected promise when failing', async () => {
      // Arrange
      const desiredState: DesiredState[] = [errorState];
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
    const desiredState: DesiredState[] = [
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

  test('notifies successes when resources succeed', async () => {
    // Arrange
    const successState = createDesiredState(MockResource, anyMockInputs);
    const desiredState: DesiredState[] = [
      successState,
      createDesiredState(ErrorResource, {}),
      createDesiredState(StallResource, {}),
    ];
    const onCreate = jest.fn();
    const generator = Generator.create(desiredState, { onCreate });

    // Act
    await generator.generateState().catch(() => undefined);

    // Assert
    expect(onCreate).toHaveBeenCalledTimes(1);
    expect(onCreate).toHaveBeenCalledWith({
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
    const desiredState: DesiredState[] = [
      stalledState,
      errorState,
      createDesiredState(MockResource, {}),
    ];
    const onError = jest.fn();
    const generator = Generator.create(desiredState, { onError });

    // Act
    await generator.generateState().catch(() => undefined);

    // Assert
    expect(onError).toHaveBeenCalledTimes(2);
    expect(onError).toHaveBeenCalledWith(
      new GenerationError(
        new Error(
          `Creating desired state item '${stalledState.name}' of resource 'StallDefinition' timed out`
        ),
        stalledState
      )
    );
    expect(onError).toHaveBeenCalledWith(
      new GenerationError(new Error('Failed to create'), errorState)
    );
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
    expect(result).toHaveLength(count);
  });

  test('creates the filled out state tree', async () => {
    // Arrange
    const successState = createDesiredState(MockResource, anyMockInputs);
    const subState = createDesiredState(SubResource, { mockId: 1 });
    explicitReturnState = [successState, subState];
    const desiredState: DesiredState[] = [successState];
    const generator = Generator.create(desiredState);

    // Act
    const result = await generator.generateState();

    // Assert
    expect(result).toHaveLength(2);
    const mockResource = result.find(
      (c) => c.desiredState.resource === MockResource
    );
    const subResource = result.find(
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
});
