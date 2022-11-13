import { TokenType } from './token-types';

export interface Token {
  type: TokenType;
  lexeme: string;
  literal?: any;
}

export const plain = (type: TokenType, lexeme: string): Token => ({
  type,
  lexeme,
});

export const identifier = (lexeme: string): Token => ({
  type: TokenType.IDENTIFIER,
  lexeme,
});

export const value = (
  type: TokenType,
  lexeme: string,
  literal: any
): Token => ({
  type,
  lexeme,
  literal,
});
