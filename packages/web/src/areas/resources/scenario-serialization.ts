import { v4 as uuid } from 'uuid';
import { StateItem } from '@haydenon/gen-server';
import {
  replaceRuntimeValueTemplates,
  parse,
  isRuntimeValue,
  Expr,
  Visitor,
  acceptExpr,
  identifier,
  type Literal,
  type Variable,
  type GetProp,
  type Call,
  type ObjectConstructor,
  type ArrayConstructor,
  type FormatString,
  type FunctionValue,
  getAnonymousName,
} from '@haydenon/gen-core';
import { DesiredResource } from './desired-resources/desired-resource';
import {
  transformFormValues,
  convertDependentStateIdsToNames,
} from './desired-resources/desired-state.utilities';
import {
  createFormRuntimeValue,
  WELL_KNOWN_RUNTIME_VALUES,
} from './runtime-value';

/**
 * Data structure for scenario data (wire format)
 */
export interface ScenarioData {
  resources: StateItem[];
}

/**
 * Serialize DesiredResource[] to ScenarioData for storage/transmission
 */
export function serializeScenario(resources: DesiredResource[]): ScenarioData {
  return {
    resources: resources.map((r) => ({
      _type: r.type,
      _name: r.name?.trim() ?? getAnonymousName(r.type),
      _dependentOnStateNames: convertDependentStateIdsToNames(r, resources),
      ...transformFormValues(r.fieldData, {
        desiredResources: resources,
      }),
    })),
  };
}

// Visitor that converts resource names to IDs in expressions
class NameToIdVisitor implements Visitor<Expr> {
  constructor(private nameToIdMap: { [name: string]: string }) {}

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
    const name = expr.name.lexeme;
    // If this variable name is a resource name, replace with ID
    if (this.nameToIdMap[name]) {
      return Expr.Variable(identifier(this.nameToIdMap[name]));
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

// Convert "${undefined}" strings to the special WELL_KNOWN_RUNTIME_VALUES.undefined
// This survives JSON serialization (unlike actual undefined which gets removed)
const parseUndefinedValues = (value: any): any => {
  // eslint-disable-next-line no-template-curly-in-string
  if (typeof value === 'string' && value === '${undefined}') {
    return WELL_KNOWN_RUNTIME_VALUES.undefined;
  }

  if (value instanceof Array) {
    return value.map((item) => parseUndefinedValues(item));
  }

  if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
    return Object.keys(value).reduce((acc, key) => {
      acc[key] = parseUndefinedValues(value[key]);
      return acc;
    }, {} as any);
  }

  return value;
};

// Convert RuntimeValue objects to FormRuntimeValue objects
const convertToFormRuntimeValues = (
  value: any,
  nameToIdMap: { [name: string]: string }
): any => {
  if (isRuntimeValue(value)) {
    // Map dependent resource names to IDs
    const dependentResourceIds = value.dependentStateNames
      .map((name) => nameToIdMap[name])
      .filter((id) => id !== undefined);

    // Transform expression to replace names with IDs
    const visitor = new NameToIdVisitor(nameToIdMap);
    const transformedExpression = acceptExpr(visitor, value.expression);

    return createFormRuntimeValue(
      undefined, // textInput not needed for AI-generated values
      transformedExpression,
      dependentResourceIds
    );
  }

  if (value instanceof Array) {
    return value.map((item) => convertToFormRuntimeValues(item, nameToIdMap));
  }

  if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
    return Object.keys(value).reduce((acc, key) => {
      acc[key] = convertToFormRuntimeValues(value[key], nameToIdMap);
      return acc;
    }, {} as any);
  }

  return value;
};

/**
 * Deserialize ScenarioData to DesiredResource[] for UI
 * Generates new UUIDs for client-side resource IDs
 */
export function deserializeScenario(data: ScenarioData): DesiredResource[] {
  if (!data || !data.resources || !Array.isArray(data.resources)) {
    return [];
  }

  // Pre-generate IDs for all resources
  const resourceIds = data.resources.map(() => uuid());

  // Create name-to-ID mapping
  const nameToIdMap: { [name: string]: string } = {};
  data.resources.forEach((stateItem: any, index: number) => {
    if (stateItem._name) {
      nameToIdMap[stateItem._name] = resourceIds[index];
    }
  });

  return data.resources.map((stateItem: any, index: number) => {
    const { _type, _name, _dependentOnStateNames, ...fieldData } = stateItem;

    // First, convert "${undefined}" strings to actual undefined values
    const undefinedParsedData = parseUndefinedValues(fieldData);

    // Parse runtime value templates (expressions like ${resource.property})
    const [parsedFieldData, errors] = replaceRuntimeValueTemplates(
      undefinedParsedData,
      parse
    );

    if (errors.length > 0) {
      console.error('Expression parsing errors:', errors);
    }

    // Convert RuntimeValue objects to FormRuntimeValue objects
    const convertedFieldData = convertToFormRuntimeValues(
      parsedFieldData,
      nameToIdMap
    );

    // Convert dependent state names to IDs
    const dependentOnStateIds = _dependentOnStateNames
      ? (_dependentOnStateNames as string[])
          .map((name: string) => nameToIdMap[name])
          .filter((id: string | undefined) => id !== undefined)
      : undefined;

    return {
      id: resourceIds[index],
      type: _type,
      name: _name,
      fieldData: convertedFieldData as { [property: string]: any },
      dependentOnStateIds,
    };
  });
}
