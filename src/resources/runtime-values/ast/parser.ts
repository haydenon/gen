import { RuntimeValue } from '../runtime-values';
import { Expr, GetProp, Literal, Variable } from './expressions';
import { Token } from './tokens/token';
import { TokenType } from './tokens/token-types';
import { Tokenizer } from './tokens/tokenizer';

export class Parser {
  private dependentStateNames: string[] = [];
  private tokens: Token[] = [];
  private current = 0;

  constructor(private source: string) {}

  public parse(): RuntimeValue<any> {
    const tokenizer = new Tokenizer(this.source);
    this.tokens = tokenizer.scanTokens();

    const expr = this.expression();
    return new RuntimeValue(this.dependentStateNames, expr);
  }

  private expression(): Expr {
    // return this.ternary();
    return this.call();
  }

  // private ternary(): Expr {
  //   const expr = this.or();

  //   if (this.match(TokenType.QUESTION_MARK)) {
  //     const ifTrue = this.ternary();
  //     this.consume("Expect ':' after true ternary condition.", TokenType.COLON);
  //     const ifFalse = this.ternary();

  //     expr = new Ternary(expr, ifTrue, ifFalse);
  //   }

  //   return expr;
  // }

  // private or(): Expr {
  //   const expr = this.and();

  //   while (this.match(TokenType.PIPE_PIPE)) {
  //     const operator = this.previous();
  //     const right = this.and();
  //     expr = new Logical(expr, operator, right);
  //   }

  //   return expr;
  // }

  // private and(): Expr {
  //   const expr = this.equality();

  //   while (this.match(TokenType.AMPER_AMPER)) {
  //     const operator = this.previous();
  //     const right = this.equality();
  //     expr = new Logical(expr, operator, right);
  //   }

  //   return expr;
  // }

  // private binary(exprFactory: () => Expr, ...types: TokenType[]): Expr {
  //   if (this.match(...types)) {
  //     const unexpected = this.previous();
  //     throw this.error(
  //       unexpected,
  //       'Expected expression on left side of binary operator'
  //     );
  //   }

  //   const expr = exprFactory();

  //   while (this.match(...types)) {
  //     const op = this.previous();
  //     const right = exprFactory();
  //     expr = new Binary(expr, op, right);
  //   }

  //   return expr;
  // }

  // private equality = (): Expr =>
  //   this.binary(this.comparison, TokenType.BANG_EQUAL, TokenType.EQUAL_EQUAL);

  // private comparison = (): Expr =>
  //   this.binary(
  //     this.term,
  //     TokenType.GREATER,
  //     TokenType.GREATER_EQUAL,
  //     TokenType.LESS,
  //     TokenType.LESS_EQUAL
  //   );

  // private term = (): Expr =>
  //   this.binary(this.factor, TokenType.MINUS, TokenType.PLUS);

  // private factor = (): Expr =>
  //   this.binary(this.unary, TokenType.SLASH, TokenType.STAR);

  // private unary = (): Expr => {
  //   if (this.match(TokenType.BANG, TokenType.MINUS)) {
  //     const op = this.previous();
  //     const right = this.unary();
  //     return new Unary(op, right);
  //   }

  //   return this.call();
  // };

  private call(): Expr {
    let expr = this.primary();

    // eslint-disable-next-line no-constant-condition
    while (true) {
      // if (this.match(TokenType.LEFT_PAREN)) {
      //   expr = this.finishCall(expr);
      // } else
      if (this.match(TokenType.DOT)) {
        const name = this.consume(
          "Expect property name after '.'.",
          TokenType.IDENTIFIER
        );
        expr = new GetProp(expr, new Literal(name.lexeme));
      } else {
        break;
      }
    }

    return expr;
  }

  // private finishCall(callee: Expr): Expr {
  //   const args: Expr[] = [];
  //   if (!this.check(TokenType.RIGHT_PAREN)) {
  //     do {
  //       args.push(this.expression());
  //     } while (this.match(TokenType.COMMA));
  //   }

  //   return new Call(callee, args);
  // }

  private primary(): Expr {
    // if (this.match(TokenType.FALSE)) return new Literal(false);
    // if (this.match(TokenType.TRUE)) return new Literal(true);
    // if (this.match(TokenType.NULL)) return new Literal(null);

    // if (this.match(TokenType.NUMBER, TokenType.STRING)) {
    //   return new Literal(this.previous().literal);
    // }

    if (this.match(TokenType.IDENTIFIER)) {
      const token = this.previous();
      this.dependentStateNames.push(token.lexeme);
      return new Variable(token);
    }

    // if (this.match(TokenType.LEFT_PAREN)) {
    //   const expr = this.expression();
    //   this.consume("Expect ')' after expression.", TokenType.RIGHT_PAREN);
    //   return new Grouping(expr);
    // }

    // if (this.match(TokenType.LEFT_SQUARE)) {
    //   const exprs: Expr[] = [];
    //   while (!this.check(TokenType.RIGHT_SQUARE) && !this.isAtEnd()) {
    //     exprs.push(this.expression());
    //     this.match(TokenType.COMMA);
    //   }
    //   this.consume("Expect ']' after array.", TokenType.RIGHT_SQUARE);
    //   return new ArrayConstructor(exprs);
    // }

    throw this.error(this.peek(), 'Expect expression.');
  }

  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }

    return false;
  }

  private check(tokenType: TokenType, position = 0): boolean {
    if (
      [...Array(position + 1).keys()].findIndex(
        (i) => this.tokens[this.current + i].type == TokenType.EOF
      ) > -1
    ) {
      return false;
    }

    return this.tokens[this.current + position].type == tokenType;
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  private consume(message: string, ...types: TokenType[]): Token {
    let token: Token = this.peek();

    for (const type of types) {
      if (!this.check(type)) {
        throw this.error(this.peek(), message);
      }
      token = this.advance();
    }

    return token;
  }

  private error(token: Token, message: string): Error {
    return new ParseError(message, token);
  }
}

class ParseError extends Error {
  constructor(public message: string, public token: Token) {
    super(message);
  }
}

export const parse = (expression: string): RuntimeValue<any> | Error => {
  const parser = new Parser(expression);
  try {
    return parser.parse();
  } catch (err) {
    return err as Error;
  }
};
