import { faker } from '@faker-js/faker';
import { constrain, int, str } from '../../resources';
import { getValueForPrimativeType } from './primatives.generator';

const runTimes = (times: number, action: () => void): void => {
  for (let i = 0; i < times; i++) {
    action();
  }
};

describe('Getting values for primative types', () => {
  describe('Strings', () => {
    test.failing('creates strings with min lengths', () => {
      runTimes(50, () => {
        // Arrange
        const minLength = faker.datatype.number({ min: 1, max: 200 });

        // Act
        const value = getValueForPrimativeType(constrain(str(), { minLength }));

        // Assert
        expect(typeof value).toBe('string');
        expect(value.length).toBeGreaterThanOrEqual(minLength);
      });
    });
  });
});
