import {
  identifier,
  Expr,
  Visitor,
  outputExpression,
  acceptExpr,
  Literal,
  Variable,
  ObjectConstructor,
  ArrayConstructor,
  Call,
  FormatString,
  FunctionValue,
  GetProp,
} from '@haydenon/gen-core';
import { FormRuntimeValue } from '../runtime-value';
import { DesiredResource } from './desired-resource';

/* eslint-disable no-template-curly-in-string */

interface FieldObj {
  [field: string]: any;
}

interface TransformationContext {
  desiredResources: DesiredResource[];
}

export function transformFormValues(
  fields: FieldObj,
  context: TransformationContext
): FieldObj {
  return Object.keys(fields).reduce((acc, field) => {
    acc[field] = transformValue(fields[field], context);
    return acc;
  }, {} as FieldObj);
}

function transformValue(value: any, context: TransformationContext): any {
  const primatives = ['string', 'number', 'boolean'];
  if (primatives.includes(typeof value)) {
    return value;
  }

  if (value === null) {
    return null;
  }

  if (value === undefined) {
    return '${undefined}'; // For JSON serialisation support
  }

  if (value instanceof Array) {
    return value.map((val) => transformValue(val, context));
  }

  if (value instanceof Date) {
    // TODO: Transform to runtime value string for serialisation
    return '${date(2000,1,1)}';
  }

  if (value instanceof FormRuntimeValue) {
    return `\${${transformRuntimeValue(value, context)}}`;
  }

  if (typeof value === 'object') {
    return transformFormValues(value, context);
  }

  throw new Error('Invalid form object');
}

function transformRuntimeValue(
  value: FormRuntimeValue,
  context: TransformationContext
): string {
  const visitor = new RuntimeValueVisitor(context);
  const transformedExpr = acceptExpr(visitor, value.expression);
  return outputExpression(transformedExpr);
}

class RuntimeValueVisitor implements Visitor<Expr> {
  constructor(private context: TransformationContext) {}

  visitLiteralExpr(expr: Literal): Expr {
    return expr;
  }
  visitArrayConstructorExpr(expr: ArrayConstructor): Expr {
    return Expr.ArrayConstructor(
      expr.items.map((exp) => acceptExpr(this, exp))
    );
  }
  visitObjectConstructorExpr(expr: ObjectConstructor): Expr {
    return Expr.ObjectConstructor(
      expr.fields.map(([tok, exp]) => [tok, acceptExpr(this, exp)])
    );
  }
  visitVariableExpr(expr: Variable): Expr {
    // TODO: Replace variables
    const guidRegex =
      /[0-9a-z]{8}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{12}/i;
    const lexeme = expr.name.lexeme;
    if (lexeme.length === 36 && guidRegex.test(lexeme)) {
      const resource = this.context.desiredResources.find(
        (r) => r.id === lexeme
      );
      if (resource && resource.name) {
        return Expr.Variable(identifier(resource.name));
      }
    }

    return expr;
  }
  visitCallExpr(expr: Call): Expr {
    return Expr.Call(
      acceptExpr(this, expr.callee),
      expr.args.map((exp) => acceptExpr(this, exp))
    );
  }
  visitGetExpr(expr: GetProp): Expr {
    return Expr.GetProp(
      acceptExpr(this, expr.obj),
      acceptExpr(this, expr.indexer)
    );
  }
  visitFormatString(expr: FormatString): Expr {
    return Expr.FormatString(
      expr.strings,
      expr.expressions.map((exp) => acceptExpr(this, exp))
    );
  }
  visitFunctionExpr(expr: FunctionValue): Expr {
    return expr;
  }
}
