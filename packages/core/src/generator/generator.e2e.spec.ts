import { MockResource, SubResource, SubSubResource } from '../../test';
import { ErasedDesiredState, createDesiredState } from '../resources';
import { getRuntimeResourceValue } from '../resources/runtime-values';
import { Generator } from './generator';

describe('Generator', () => {
  test('supports resolving resources in runtime values', async () => {
    // Arrange
    const mockText = 'this is the mock value';
    const successState = createDesiredState(MockResource, { text: mockText });
    const subState = createDesiredState(SubResource, {
      mockId: getRuntimeResourceValue(successState, 'id'),
      text: 'this is different text',
    });
    const subSubState = createDesiredState(SubSubResource, {
      subId: getRuntimeResourceValue(subState, 'id'),
    });
    const desiredState: ErasedDesiredState[] = [
      successState,
      subState,
      subSubState,
    ];
    const generator = Generator.create(desiredState);

    // Act
    const result = await generator.generateState();

    // Assert
    expect(result.createdState).toHaveLength(3);
    const subResource = result.createdState.find(
      (c) => c.desiredState.resource === SubResource
    );
    expect(subResource).toMatchObject({
      desiredState: subState,
      outputs: {
        inheritedMockText: mockText,
      },
    });

    const subSubResource = result.createdState.find(
      (c) => c.desiredState.resource === SubSubResource
    );
    expect(subSubResource).toMatchObject({
      desiredState: subSubState,
      outputs: {
        inheritedMockText: mockText,
      },
    });
  });
});
