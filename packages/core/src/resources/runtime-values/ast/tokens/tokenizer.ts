import { Token } from './token';
import { TokenType } from './token-types';

const isLetterOrIdentifier = (char: string): boolean =>
  char == '$' || char == '_' || isLetter(char);

const isLetterOrDigitOrIdentifier = (char: string): boolean =>
  char == '$' || char == '_' || isLetter(char) || isDigit(char);

const isLetter = (char: string): boolean =>
  (char >= 'a' && char <= 'z') ||
  (char >= 'A' && char <= 'Z') ||
  (char >= '\u00C0' && char <= '\u00D6') ||
  (char >= '\u00D8' && char <= '\u00F6') ||
  (char >= '\u00F8' && char <= '\u00FF') ||
  (char >= '\u0100' && char <= '\uFFFE');

const isDigit = (char: string): boolean => char >= '0' && char <= '9';

export class Tokenizer {
  private start = 0;
  private current = 0;

  private tokens: Token[] = [];

  constructor(private source: string) {}

  public scanTokens(): Token[] {
    while (!this.isAtEnd()) {
      this.start = this.current;
      this.scanToken();
    }
    this.tokens.push({ type: TokenType.EOF, lexeme: '' });
    return this.tokens;
  }

  private keywords: { [word: string]: TokenType } = {
    true: TokenType.TRUE,
    false: TokenType.FALSE,
    null: TokenType.NULL,
  };

  private charHandlers: { [char: string]: () => void } = {
    '(': () => this.addToken(TokenType.LEFT_PAREN),
    ')': () => this.addToken(TokenType.RIGHT_PAREN),
    '[': () => this.addToken(TokenType.LEFT_SQUARE),
    ']': () => this.addToken(TokenType.RIGHT_SQUARE),
    ',': () => this.addToken(TokenType.COMMA),
    '.': () => this.addToken(TokenType.DOT),
    '-': () => this.addToken(TokenType.MINUS),
    '+': () => this.addToken(TokenType.PLUS),
    '/': () => this.addToken(TokenType.SLASH),
    '*': () => this.addToken(TokenType.STAR),
    '?': () => this.addToken(TokenType.QUESTION_MARK),
    ':': () => this.addToken(TokenType.COLON),
    '&&': () => this.addToken(TokenType.AMPER_AMPER),
    '||': () => this.addToken(TokenType.PIPE_PIPE),
    '!': () =>
      this.addToken(this.match('=') ? TokenType.BANG_EQUAL : TokenType.BANG),
    '=': () =>
      this.addToken(this.match('=') ? TokenType.EQUAL_EQUAL : TokenType.EQUAL),
    '<': () => {
      if (this.match('=')) {
        this.addToken(TokenType.LESS_EQUAL);
      } else {
        this.addToken(TokenType.LESS);
      }
    },
    '>': () => {
      if (this.match('=')) {
        this.addToken(TokenType.GREATER_EQUAL);
      } else {
        this.addToken(TokenType.GREATER);
      }
    },
    ' ': () => {},
    '\t': () => {},
    '"': () => this.string(true),
    "'": () => {
      this.string(false);
    },
  };

  private scanToken(): void {
    const c = this.advance();
    if (isLetterOrIdentifier(c)) {
      this.identifier();
    } else if (isDigit(c)) {
      this.number();
    } else {
      this.charHandlers[c]();
    }
  }

  private identifier(): void {
    while (isLetterOrDigitOrIdentifier(this.peek())) this.advance();

    const text = this.source.substring(this.start, this.current);
    const type = this.keywords[text] ?? TokenType.IDENTIFIER;
    this.addToken(type);
  }

  private string(doubleQuotes: boolean): void {
    const terminator = doubleQuotes ? '"' : "'";

    while (this.peek() != terminator && !this.isAtEnd()) {
      this.advance();
    }

    if (this.isAtEnd()) {
      throw new Error('Unterminated string.');
    }

    this.advance();

    const value = this.source.substring(this.start + 1, this.current - 1);
    this.addToken(TokenType.STRING, value);
  }

  private number(): void {
    while (isDigit(this.peek())) this.advance();

    let float = false;
    // Look for a fractional part.
    if (this.peek() == '.' && isDigit(this.peekNext())) {
      float = true;
      // Consume the "."
      this.advance();

      while (isDigit(this.peek())) this.advance();
    }

    const value = this.source.substring(this.start, this.current);
    this.addToken(
      TokenType.NUMBER,
      float ? parseFloat(value) : parseInt(value)
    );
  }

  private advance(): string {
    this.current++;
    return this.source[this.current - 1];
  }

  private match(expected: string): boolean {
    if (this.isAtEnd()) return false;
    if (this.peek() != expected) return false;

    this.current++;
    return true;
  }

  private peek(): string {
    if (this.isAtEnd()) return '\u0000';
    return this.source[this.current];
  }

  private peekNext(n = 1): string {
    if (this.current + n >= this.source.length) return '\u0000';
    return this.source[this.current + n];
  }

  private isAtEnd(): boolean {
    return this.current >= this.source.length;
  }

  private addToken(type: TokenType, literal: any = undefined): void {
    const lexeme = this.source.substring(this.start, this.current);
    this.tokens.push({
      type,
      lexeme,
      literal,
    });
  }
}
