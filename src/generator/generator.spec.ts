import {
  createDesiredState,
  DesiredState,
  InputBase,
  InputDefinition,
  InputMap,
  InputValues,
  OutputMap,
  Primatives,
  PropertyDefinition,
  PropertyType,
  PropertyValues,
  Resource,
  ResourceInstance,
  Type,
} from '../resources';
import { GenerationError, GenerationResultError, Generator } from './generator';

class MockInputs extends InputBase {
  text: PropertyDefinition<Type<string>> = Primatives.String;
  number: PropertyDefinition<Type<number>> = Primatives.Number;
  boolean: PropertyDefinition<Type<boolean>> = Primatives.Boolean;
}

class MockOutputs extends InputBase {
  text: PropertyDefinition<Type<string>> = Primatives.String;
  number: PropertyDefinition<Type<number>> = Primatives.Number;
  boolean: PropertyDefinition<Type<boolean>> = Primatives.Boolean;
}

class MockDefinition extends Resource<MockInputs, MockOutputs> {
  constructor() {
    super(new MockInputs(), new MockOutputs());
  }

  create(
    inputs: PropertyValues<InputDefinition<PropertyType>, MockInputs>
  ): Promise<ResourceInstance<MockOutputs>> {
    return Promise.resolve({
      values: {
        text: inputs.text,
        number: inputs.number,
        boolean: inputs.boolean,
      },
    });
  }
}

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

const MockResource = new MockDefinition();

describe('Generator', () => {
  describe('Inputs', () => {
    test('generates resources with explicit inputs', async () => {
      // Arrange
      const generator = new Generator([MockResource]);
      const inputValues: InputValues<MockInputs> = {
        text: 'Test',
        boolean: true,
        number: 2,
      };
      const desiredState: DesiredState<
        InputMap,
        Resource<InputMap, OutputMap>
      >[] = [createDesiredState(MockResource, inputValues)];

      // Act
      const result = await generator.generateState(desiredState);

      // Assert
      expect(result).toEqual([{ values: inputValues }]);
    });

    test('generates resources with no inputs', async () => {
      // Arrange
      const generator = new Generator([MockResource]);
      const desiredState: DesiredState<
        InputMap,
        Resource<InputMap, OutputMap>
      >[] = [createDesiredState(MockResource, {})];

      // Act
      const result = await generator.generateState(desiredState);

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

  describe('Error handling', () => {
    test('handles timeouts', async () => {
      // Arrange
      const generator = new Generator([StallResource]);
      const stalledState = createDesiredState(StallResource, {});
      const desiredState: DesiredState<
        InputMap,
        Resource<InputMap, OutputMap>
      >[] = [stalledState];

      // Act
      const result = generator.generateState(desiredState);

      // Assert
      await expect(result).rejects.toStrictEqual(
        new GenerationResultError('Generation encountered errors', [
          new GenerationError(
            new Error(expect.stringContaining('timed out')),
            stalledState
          ),
        ])
      );
    });
  });
});
