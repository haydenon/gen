import { truncate } from './string';

const anyString = 'hello';

describe('String utilities', () => {
  test('truncate returns original string if shorter than length', () => {
    // Act
    const result = truncate(anyString, anyString.length + 5);

    // Assert
    expect(result).toBe(anyString);
  });

  test('truncate returns original string if same as length', () => {
    // Act
    const result = truncate(anyString, anyString.length);

    // Assert
    expect(result).toBe(anyString);
  });

  test('truncate shortens string if longer than length', () => {
    // Act
    const result = truncate('longerstring', 4);

    // Assert
    expect(result).toBe('long');
  });
});
