import {
  createDesiredState,
  DesiredState,
  PropertyDefinition,
  PropertyValues,
  Resource,
  PropertiesBase,
  getLink,
  OutputValues,
  InputValues,
  def,
  Props,
} from '../resources';
import {
  GenerationError,
  GenerationResultError,
  Generator,
  ResourceLink,
} from './generator';

class MockBase extends PropertiesBase {
  text: PropertyDefinition<string> = def(Props.String);
  number: PropertyDefinition<number> = def(Props.Number);
  boolean: PropertyDefinition<boolean> = def(Props.Boolean);
}

let mockId = 1;
class MockOutputs extends MockBase {
  id: PropertyDefinition<number> = def(Props.Number);
}

class MockDefinition extends Resource<MockBase, MockOutputs> {
  constructor(private time?: number) {
    super(new MockBase(), new MockOutputs());
  }

  create(inputs: PropertyValues<MockBase>): Promise<OutputValues<MockOutputs>> {
    const instance = {
      id: mockId++,
      text: inputs.text,
      number: inputs.number,
      boolean: inputs.boolean,
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

class StallDefinition extends Resource<MockBase, MockOutputs> {
  constructor() {
    super(new MockBase(), new MockOutputs());
  }

  create(): Promise<OutputValues<MockOutputs>> {
    return new Promise(() => {
      //
    });
  }

  createTimeoutMillis = 200;
}
const StallResource = new StallDefinition();

class ErrorDefinition extends Resource<MockBase, MockOutputs> {
  constructor() {
    super(new MockBase(), new MockOutputs());
  }

  create(): Promise<OutputValues<MockOutputs>> {
    return Promise.reject(new Error('Failed to create'));
  }

  createTimeoutMillis = 200;
}
const ErrorResource = new ErrorDefinition();

let subId = 1;
class SubBase extends PropertiesBase {
  mockId: PropertyDefinition<number> = getLink(MockResource, (m) => m.id);
}
class SubOutputs extends SubBase {
  id: PropertyDefinition<number> = def(Props.Number);
}
class SubDefinition extends Resource<SubBase, SubOutputs> {
  constructor() {
    super(new SubBase(), new SubOutputs());
  }

  create(inputs: PropertyValues<SubBase>): Promise<OutputValues<SubOutputs>> {
    return Promise.resolve({
      ...inputs,
      id: subId++,
    });
  }
}
const SubResource = new SubDefinition();

let subSubId = 1;
class SubSubBase extends PropertiesBase {
  subId: PropertyDefinition<number> = getLink(SubResource, (s) => s.id);
}
class SubSubOutputs extends SubSubBase {
  id: PropertyDefinition<number> = def(Props.Number);
}
class SubSubDefinition extends Resource<SubSubBase, SubSubOutputs> {
  constructor() {
    super(new SubSubBase(), new SubSubOutputs());
  }

  create(
    inputs: PropertyValues<SubSubBase>
  ): Promise<OutputValues<SubSubOutputs>> {
    return Promise.resolve({
      ...inputs,
      id: subSubId++,
    });
  }
}
const SubSubResource = new SubSubDefinition();

const anyMockResource = {
  id: expect.any(Number),
  text: expect.any(String),
  number: expect.any(Number),
  boolean: expect.any(Boolean),
};

describe('Generator', () => {
  describe('Inputs', () => {
    test('generates resources with explicit inputs', async () => {
      // Arrange
      const PropertyValues: InputValues<MockBase> = {
        text: 'Test',
        boolean: true,
        number: 2,
      };
      const state = createDesiredState(MockResource, PropertyValues);
      const desiredState: DesiredState[] = [state];
      const generator = Generator.create(desiredState);

      // Act
      const result = await generator.generateState();

      // Assert
      expect(result).toEqual([
        { desiredState: state, outputs: PropertyValues },
      ]);
    });

    test('generates resources with no inputs', async () => {
      // Arrange
      const state = createDesiredState(MockResource, {});
      const desiredState: DesiredState[] = [state];
      const generator = Generator.create(desiredState);

      // Act
      const result = await generator.generateState();

      // Assert
      expect(result).toEqual([
        {
          desiredState: state,
          outputs: anyMockResource,
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

  describe('Linked resources', () => {
    test('can create anonymous depdendencies', async () => {
      // Arrange
      const state = [createDesiredState(SubSubResource, {})];
      const generator = Generator.create(state);

      // Act
      const result = await generator.generateState();

      // Assert
      expect(result).toHaveLength(3);
      const mockResource = result.find(
        (i) => i.desiredState.resource === MockResource
      );
      expect(mockResource).toEqual({
        desiredState: {
          name: expect.any(String),
          resource: MockResource,
          inputs: {},
        },
        outputs: anyMockResource,
      });

      const subResource = result.find(
        (i) => i.desiredState.resource === SubResource
      );
      expect(subResource).toEqual({
        desiredState: {
          name: expect.any(String),
          resource: SubResource,
          inputs: {
            mockId: expect.any(ResourceLink),
          },
        },
        outputs: {
          id: expect.any(Number),
          mockId: mockResource?.outputs.id,
        },
      });

      const subSubResource = result.find(
        (i) => i.desiredState.resource === SubSubResource
      );
      expect(subSubResource).toEqual({
        desiredState: {
          name: expect.any(String),
          resource: SubSubResource,
          inputs: {
            subId: expect.any(ResourceLink),
          },
        },
        outputs: {
          id: expect.any(Number),
          subId: subResource?.outputs.id,
        },
      });
    });
  });
});
