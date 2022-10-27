import { createDesiredState, DesiredState } from '../../resources';
import { InputValues } from '../../resources/resource';
import { ResourceLink } from '../generator';
import {
  MockBase,
  MockResource,
  SubResource,
  SubSubResource,
} from '../../../test/resources';
import { fillInDesiredStateTree } from './state-tree.generator';

const anyMockInputs = {
  text: expect.any(String),
  number: expect.any(Number),
  boolean: expect.any(Boolean),
};

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
      },
    });
  });
});
