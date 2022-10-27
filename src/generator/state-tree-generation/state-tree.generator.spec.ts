import {
  array,
  bool,
  complex,
  constrain,
  createDesiredState,
  def,
  dependentGenerator,
  DesiredState,
  float,
  int,
  PropertyDefinition,
  str,
} from '../../resources';
import {
  InputValues,
  PropertiesBase,
  Resource,
} from '../../resources/resource';
import { ResourceLink } from '../generator';
import {
  MockBase,
  MockResource,
  SubResource,
  SubSubResource,
} from '../../../test/resources';
import { fillInDesiredStateTree } from './state-tree.generator';
import { ComplexType, PropertyType } from '../../resources/properties';

const anyMockInputs = {
  text: expect.any(String),
  number: expect.any(Number),
  boolean: expect.any(Boolean),
};

class AnyOutput extends PropertiesBase {}

class ValidDependentInput extends PropertiesBase {
  a: PropertyDefinition<string> = def(str());
  b: PropertyDefinition<string> = def(
    constrain(
      str(),
      dependentGenerator<ValidDependentInput, string>((values) => values.a)
    )
  );
}
class ValidResource extends Resource<ValidDependentInput, AnyOutput> {
  constructor() {
    super(new ValidDependentInput(), new AnyOutput());
  }
  create = () => Promise.resolve({});
}
const Valid = new ValidResource();

class CircularDependentInput extends PropertiesBase {
  a: PropertyDefinition<string> = def(
    constrain(
      str(),
      dependentGenerator<ValidDependentInput, string>((values) => values.b)
    )
  );
  b: PropertyDefinition<string> = def(
    constrain(
      str(),
      dependentGenerator<ValidDependentInput, string>((values) => values.a)
    )
  );
}
class CircularResource extends Resource<CircularDependentInput, AnyOutput> {
  constructor() {
    super(new CircularDependentInput(), new AnyOutput());
  }
  create = () => Promise.resolve({});
}
const Circular = new CircularResource();

interface ComplexValue {
  name: string;
  age: number;
  living: boolean;
  favouriteColours: string[];
}

const anyComplexValue = {
  name: expect.any(String),
  age: expect.any(Number),
  living: expect.any(Boolean),
  favouriteColours: expect.any(Array),
};

const complexType: ComplexType = complex<ComplexValue>({
  name: str(),
  age: int(),
  living: bool(),
  favouriteColours: array(str()),
});

class AdvancedInput extends PropertiesBase {
  a: PropertyDefinition<ComplexValue> = def(complexType as any);
  b: PropertyDefinition<number[]> = def(array(float()));
  c: PropertyDefinition<ComplexValue[]> = def(array(complexType as any));
}
class AdvancedResource extends Resource<AdvancedInput, AnyOutput> {
  constructor() {
    super(new AdvancedInput(), new AnyOutput());
  }
  create = () => Promise.resolve({});
}
const Advanced = new AdvancedResource();

describe('State tree creation', () => {
  test('does not fill in resource inputs with explicit inputs', async () => {
    // Arrange
    const PropertyValues: InputValues<MockBase> = {
      text: 'Test',
      boolean: true,
      number: 2,
    };
    const state = createDesiredState(MockResource, PropertyValues);
    const desiredState: DesiredState[] = [state];

    // Act
    const filledOutState = fillInDesiredStateTree(desiredState);

    // Assert
    expect(filledOutState).toEqual([state]);
  });

  test('fills in resource inputs with no values', async () => {
    // Arrange
    const state = createDesiredState(MockResource, {});
    const desiredState: DesiredState[] = [state];

    // Act
    const filledOutState = fillInDesiredStateTree(desiredState);

    // Assert
    expect(filledOutState).toEqual([state]);
  });

  test('can create anonymous depdendencies', async () => {
    // Arrange
    const state = [createDesiredState(SubSubResource, {})];

    // Act
    const filledOutState = fillInDesiredStateTree(state);

    // Assert
    expect(filledOutState).toHaveLength(3);
    const mockResource = filledOutState.find(
      (i) => i.resource === MockResource
    );
    expect(mockResource).toEqual({
      name: expect.any(String),
      resource: MockResource,
      inputs: anyMockInputs,
    });

    const subResource = filledOutState.find((i) => i.resource === SubResource);
    expect(subResource).toEqual({
      name: expect.any(String),
      resource: SubResource,
      inputs: {
        mockId: expect.any(ResourceLink),
        text: expect.any(String),
      },
    });

    const subSubResource = filledOutState.find(
      (i) => i.resource === SubSubResource
    );
    expect(subSubResource).toEqual({
      name: expect.any(String),
      resource: SubSubResource,
      inputs: {
        subId: expect.any(ResourceLink),
        text: expect.any(String),
      },
    });
  });

  [{}, { a: 'Test' }].forEach((values) =>
    test('supports filling in values with dependent generator', () => {
      // Arrange
      const state = [createDesiredState(Valid, values)];

      // Act
      const filledInState = fillInDesiredStateTree(state);

      // Assert
      expect(filledInState).toHaveLength(1);
      const filledIn = filledInState[0];
      expect(filledIn.inputs.b).toBe(values.a ?? filledIn.inputs.a);
    })
  );

  test('errors filling in values with circular reference in dependent generator', () => {
    // Arrange
    const state = [createDesiredState(Circular, {})];

    // Act & Assert
    expect(() => fillInDesiredStateTree(state)).toThrow();
  });

  test('fills in complex values', () => {
    // Arrange
    const state = [createDesiredState(Advanced, {})];

    // Act
    const filledInState = fillInDesiredStateTree(state);

    // Assert
    expect(filledInState).toHaveLength(1);
    const filledIn = filledInState[0];
    expect(filledIn.inputs.a).toEqual(anyComplexValue);
  });
});
