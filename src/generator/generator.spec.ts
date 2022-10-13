import {
  createDesiredState,
  DesiredState,
  PropertyMap,
  Primatives,
  PropertyDefinition,
  PropertyValues,
  Resource,
  ResourceInstance,
  Type,
  PropertiesBase,
} from '../resources';
import { GenerationError, GenerationResultError, Generator } from './generator';

class MockInputs extends PropertiesBase {
  text: PropertyDefinition<Type<string>> = Primatives.String;
  number: PropertyDefinition<Type<number>> = Primatives.Number;
  boolean: PropertyDefinition<Type<boolean>> = Primatives.Boolean;
}

class MockOutputs extends PropertiesBase {
  text: PropertyDefinition<Type<string>> = Primatives.String;
  number: PropertyDefinition<Type<number>> = Primatives.Number;
  boolean: PropertyDefinition<Type<boolean>> = Primatives.Boolean;
}

class MockDefinition extends Resource<MockInputs, MockOutputs> {
  constructor(private time?: number) {
    super(new MockInputs(), new MockOutputs());
  }

  create(
    inputs: PropertyValues<MockInputs>
  ): Promise<ResourceInstance<MockOutputs>> {
    const instance = {
      values: {
        text: inputs.text,
        number: inputs.number,
        boolean: inputs.boolean,
      },
    };
    if (!this.time || this.time <= 0) {
      return Promise.resolve(instance);
    }

    return new Promise((res) => {
      setTimeout(() => res(instance), this.time);
    });
  }
}
const MockResource = new MockDefinition();
const DelayResource = new MockDefinition(100);

class StallDefinition extends Resource<MockInputs, MockOutputs> {
  constructor() {
    super(new MockInputs(), new MockOutputs());
  }

  create(): Promise<ResourceInstance<MockOutputs>> {
    return new Promise(() => {
      //
    });
  }

  createTimeoutMillis = 200;
}
const StallResource = new StallDefinition();

class ErrorDefinition extends Resource<MockInputs, MockOutputs> {
  constructor() {
    super(new MockInputs(), new MockOutputs());
  }

  create(): Promise<ResourceInstance<MockOutputs>> {
    return Promise.reject(new Error('Failed to create'));
  }

  createTimeoutMillis = 200;
}
const ErrorResource = new ErrorDefinition();

describe('Generator', () => {
  describe('Inputs', () => {
    test('generates resources with explicit inputs', async () => {
      // Arrange
      const PropertyValues: PropertyValues<MockInputs> = {
        text: 'Test',
        boolean: true,
        number: 2,
      };
      const desiredState: DesiredState[] = [
        createDesiredState(MockResource, PropertyValues),
      ];
      const generator = Generator.create(desiredState);

      // Act
      const result = await generator.generateState();

      // Assert
      expect(result).toEqual([{ values: PropertyValues }]);
    });

    test('generates resources with no inputs', async () => {
      // Arrange
      const desiredState: DesiredState[] = [
        createDesiredState(MockResource, {}),
      ];
      const generator = Generator.create(desiredState);

      // Act
      const result = await generator.generateState();

      // Assert
      expect(result).toEqual([
        {
          values: {
            text: expect.any(String),
            number: expect.any(Number),
            boolean: expect.any(Boolean),
          },
        },
      ]);
    });
  });

  describe('Results and notifications', () => {
    test('returns resolved promise when succeeding', async () => {
      // Arrange
      const successState = createDesiredState(MockResource, {});
      const desiredState: DesiredState[] = [successState];
      const generator = Generator.create(desiredState);

      // Act
      const result = await generator.generateState();

      // Assert
      expect(result).toStrictEqual([
        {
          values: {
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
      const successState = createDesiredState(MockResource, {});
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
        values: {
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
  });

  describe('Volume', () => {
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
  });
});
