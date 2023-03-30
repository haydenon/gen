export {
  Resource,
  PropertiesBase,
  ResourceGroup,
  validateResourceName,
} from './resource';
export type {
  PropertyValues,
  ResolvedValues,
  OutputValues,
  PropertyMap,
} from './resource';
export {
  def,
  bool,
  string,
  int,
  float,
  date,
  undefinable,
  nullOrUndefinable,
  nullable,
  array,
  complex,
  lookup,
  Type,
} from './properties/properties';
export type { PropertyType, PropertyDefinition } from './properties/properties';
export {
  getLink,
  ParentCreationMode,
  constrainAll,
  getOptionalLink,
} from './properties/links';
export { createDesiredState, getAnonymousName } from './desired-state';
export type { DesiredState, ErasedDesiredState } from './desired-state';
export {
  RuntimeValue,
  mapValue,
  mapValues,
  mapPropTypeToExprType,
  complexObject,
  outputExprType,
  expressionTypeHelpers,
  containsType,
  Expr,
  acceptExpr,
  outputExpression,
  identifier,
  BASE_CONTEXT_TYPES,
  evaluate,
} from './runtime-values';
export type {
  ExprType,
  Visitor,
  Context,
  ContextTypes,
  GetProp,
  Variable,
  Call,
  ObjectConstructor,
  ArrayConstructor,
  FunctionValue,
  FormatString,
  Literal,
} from './runtime-values';
export {
  GenerationResult,
  dependentGenerator,
  generator,
  parentConstraint,
} from './properties/constraints';
export type { Constraint } from './properties/constraints';
