declare module '@haydenon/gen/generator/generator' {
  import { ErasedResourceInstance } from '@haydenon/gen/resources/instance';
  import { ErasedDesiredState } from '@haydenon/gen/resources/desired-state';
  interface GeneratorOptions {
      onCreate?: (resource: ErasedResourceInstance) => void;
      onError?: (error: GenerationError) => void;
  }
  interface GeneratedStateResponse {
      desiredState: ErasedDesiredState[];
      createdState: ErasedResourceInstance[];
  }
  export class Generator {
      private stateNodes;
      private options?;
      private inProgressCount;
      private queued;
      private resolve;
      private reject;
      private promise;
      private desiredState;
      private constructor();
      generateState(): Promise<GeneratedStateResponse>;
      private runRound;
      private createDesiredState;
      private fillInRuntimeValues;
      private getRuntimeValue;
      private notifyItemSuccess;
      private notifyItemError;
      private get anyInProgress();
      private getNextForCreation;
      private completeGeneration;
      private markCreating;
      private markCreated;
      private markFailed;
      private appendReadyNodesToQueue;
      static create(state: ErasedDesiredState[], options?: GeneratorOptions): Generator;
      private getNodeForState;
      private static getStructure;
  }
  export class GenerationError extends Error {
      inner: Error;
      desired: ErasedDesiredState;
      constructor(inner: Error, desired: ErasedDesiredState);
  }
  export class GenerationResultError extends Error {
      errors?: GenerationError[] | undefined;
      constructor(message: string, errors?: GenerationError[] | undefined);
  }
  export {};

}
declare module '@haydenon/gen/generator/index' {
  export { Generator, GenerationError, GenerationResultError } from '@haydenon/gen/generator/generator';

}
declare module '@haydenon/gen/generator/state-tree-generation/primatives.generator' {
  import { PropertyType } from '@haydenon/gen/resources/properties/properties';
  export function getValueForPrimativeType(type: PropertyType): any;

}
declare module '@haydenon/gen/generator/state-tree-generation/state-tree.generator' {
  import { ErasedDesiredState } from '@haydenon/gen/resources/desired-state';
  export function fillInDesiredStateTree(state: ErasedDesiredState[]): ErasedDesiredState[];

}
declare module '@haydenon/gen/index' {
  export * from '@haydenon/gen/resources/index';
  export * from '@haydenon/gen/generator/index';
  export * from '@haydenon/gen/utilities/index';
  export * from '@haydenon/gen/server/index';

}
declare module '@haydenon/gen/resources/desired-state' {
  import { PropertyMap, Resource, PropertyValues, InputValues } from '@haydenon/gen/resources/resource';
  export interface DesiredState<Res extends Resource<PropertyMap, PropertyMap>> {
      name: string;
      resource: Res;
      inputs: Partial<PropertyValues<Res['inputs']>>;
  }
  export type ErasedDesiredState = DesiredState<Resource<PropertyMap, PropertyMap>>;
  export function createDesiredState<Res extends Resource<PropertyMap, PropertyMap>>(resource: Res, inputs: Partial<InputValues<Res['inputs']>>, name?: string): DesiredState<Res>;

}
declare module '@haydenon/gen/resources/index' {
  export { Resource, PropertiesBase, PropertyValues, ResolvedPropertyValues as ResolvedInputs, OutputValues, ResourceGroup, } from '@haydenon/gen/resources/resource';
  export { PropertyDefinition, def, bool, string, int, float, date, undefinable, nullOrUndefinable, nullable, array, complex, lookup, } from '@haydenon/gen/resources/properties/properties';
  export { getLink, ParentCreationMode, constrainAll, getOptionalLink, } from '@haydenon/gen/resources/properties/links';
  export { DesiredState, createDesiredState } from '@haydenon/gen/resources/desired-state';
  export { mapValue, mapValues } from '@haydenon/gen/resources/runtime-values/runtime-values';
  export { GenerationResult, dependentGenerator, generator, parentConstraint, } from '@haydenon/gen/resources/properties/constraints';

}
declare module '@haydenon/gen/resources/instance' {
  import { DesiredState } from '@haydenon/gen/resources/desired-state';
  import { PropertyMap, PropertyValues, Resource } from '@haydenon/gen/resources/resource';
  export interface ResourceInstance<Res extends Resource<PropertyMap, PropertyMap>> {
      desiredState: DesiredState<Res>;
      outputs: PropertyValues<Res['outputs']>;
  }
  export type ErasedResourceInstance = ResourceInstance<Resource<PropertyMap, PropertyMap>>;

}
declare module '@haydenon/gen/resources/properties/constraints' {
  import { ParentCreationMode, ResolvedInputs } from '@haydenon/gen/resources/index';
  import { PropertyMap, PropertyValues, ResourceOrGroupItem } from '@haydenon/gen/resources/resource';
  import { RuntimeValue } from '@haydenon/gen/resources/runtime-values/index';
  import { IntType, LinkOfType, StringType, Value } from '@haydenon/gen/resources/properties/properties';
  export class GenerationResult {
      wasGenerated: boolean;
      private constructor();
      static ValueNotGenerated: GenerationResult;
  }
  export interface BaseConstraint<T> {
      isValid?: (value: T) => boolean;
      generateConstrainedValue?: (values: PropertyValues<PropertyMap>) => T | RuntimeValue<T> | GenerationResult;
  }
  export interface IntConstraint extends BaseConstraint<number> {
      min?: number;
      max?: number;
      float?: boolean;
      precision?: number;
  }
  export interface FloatConstraint extends BaseConstraint<number> {
      min?: number;
      max?: number;
      precision?: number;
  }
  export interface DateConstraint extends BaseConstraint<Date> {
      minDate?: Date;
      maxDate?: Date;
  }
  export interface StringConstraint extends BaseConstraint<string> {
      minLength?: number;
      maxLength?: number;
  }
  export interface ArrayConstraint<T> extends BaseConstraint<T[]> {
      minItems?: number;
      maxItems?: number;
  }
  export type StringOrIntLink<Res extends ResourceOrGroupItem<PropertyMap, PropertyMap>> = LinkOfType<Res, StringType, true> | LinkOfType<Res, IntType, true>;
  export type UndefinableStringOrIntLink<Res extends ResourceOrGroupItem<PropertyMap, PropertyMap>> = LinkOfType<Res, StringType, false> | LinkOfType<Res, IntType, false>;
  export interface ParentConstraints<T extends ResourceOrGroupItem<PropertyMap, PropertyMap>> {
      setValue<V>(accessor: (parentInputs: ResolvedInputs<T['inputs']>) => V, value: Value<V>): void;
      ancestor<Ancestor extends ResourceOrGroupItem<PropertyMap, PropertyMap>>(accessor: (parentInputs: ResolvedInputs<T['inputs']>) => string | number): ParentConstraints<Ancestor>;
      ancestor<Ancestor extends ResourceOrGroupItem<PropertyMap, PropertyMap>>(accessor: (parentInputs: ResolvedInputs<T['inputs']>) => (string | undefined) | (number | undefined), creationMode: ParentCreationMode): ParentConstraints<Ancestor>;
  }
  export interface LinkConstraint<Res extends ResourceOrGroupItem<PropertyMap, PropertyMap>> extends BaseConstraint<any> {
      parentConstraint?: (constraints: ParentConstraints<Res>, childValues: PropertyValues<PropertyMap>) => void;
  }
  export type Constraint<T> = null extends T ? BaseConstraint<T> : undefined extends T ? BaseConstraint<T> : T extends number ? IntConstraint | FloatConstraint : T extends string ? StringConstraint : T extends (infer Type)[] ? ArrayConstraint<Type> : T extends Date ? DateConstraint : BaseConstraint<T>;
  export function dependentGenerator<Inputs extends PropertyMap, Prop>(inputs: Inputs, func: (values: PropertyValues<Inputs>) => Value<Prop> | GenerationResult): BaseConstraint<Prop>;
  export function generator<Prop>(func: () => Prop | GenerationResult): BaseConstraint<Prop>;
  export function parentConstraint<Inputs extends PropertyMap, Parent extends ResourceOrGroupItem<PropertyMap, PropertyMap>>(inputs: Inputs, parent: Parent, func: (constraints: ParentConstraints<Parent>, childValues: PropertyValues<Inputs>) => void): LinkConstraint<Parent>;

}
declare module '@haydenon/gen/resources/properties/index' {
  export { PropertyDefinition, def, bool, string as str, int, float, date, undefinable, nullOrUndefinable, nullable, array, complex, lookup, Value, } from '@haydenon/gen/resources/properties/properties';
  export { validateInputValue, validateInputValues } from '@haydenon/gen/resources/properties/validation';
  export { dependentGenerator, generator, GenerationResult } from '@haydenon/gen/resources/properties/constraints';

}
declare module '@haydenon/gen/resources/properties/links' {
  import { PropertyMap, Resource, ResourceGroup } from '@haydenon/gen/resources/resource';
  import { StateConstraint } from '@haydenon/gen/resources/state-constraints';
  import { LinkConstraint, ParentConstraints } from '@haydenon/gen/resources/properties/constraints';
  import { IntType, LinkType, LinkOfType, PropertyDefinition, PropertyType, StringType, TypeForProperty } from '@haydenon/gen/resources/properties/properties';
  export function isLinkType(type: PropertyType): type is LinkType<any>;
  export enum ParentCreationMode {
      Create = "Create",
      DoNotCreate = "DoNotCreate",
      MaybeCreate = "MaybeCreate"
  }
  export const constrainAll: <T>(value: T[]) => T;
  export const getParentConstraintsUtilsAndResults: () => [
      ParentConstraints<any>,
      StateConstraint[]
  ];
  export interface ParentCreationConstraint {
      mode?: ParentCreationMode;
  }
  type OutputsForResourceOrGroup<T> = T extends Resource<PropertyMap, PropertyMap> ? T['outputs'] : T extends ResourceGroup<PropertyMap, PropertyMap> ? T[0]['outputs'] : never;
  type BaseLinkType<Prop extends PropertyDefinition<any>> = TypeForProperty<Prop> extends number ? IntType : TypeForProperty<Prop> extends string ? StringType : never;
  export function getLink<Res extends Resource<PropertyMap, PropertyMap>, T, Prop extends PropertyDefinition<T>>(resource: Res, accessor: (res: OutputsForResourceOrGroup<Res>) => PropertyDefinition<T>, constraint?: LinkConstraint<Res>): LinkOfType<Res, BaseLinkType<Prop>, true>;
  export function getLink<ResGroup extends ResourceGroup<PropertyMap, PropertyMap>, T, Prop extends PropertyDefinition<T>>(resources: ResGroup, accessor: (res: OutputsForResourceOrGroup<ResGroup>) => PropertyDefinition<T>, constraint?: LinkConstraint<ResGroup[0]>): LinkOfType<ResGroup[0], BaseLinkType<Prop>, true>;
  export function getOptionalLink<Res extends Resource<PropertyMap, PropertyMap>, T, Prop extends PropertyDefinition<T>>(resource: Res, accessor: (res: OutputsForResourceOrGroup<Res>) => PropertyDefinition<T>, mode: ParentCreationMode, constraint?: LinkConstraint<Res>): LinkOfType<Res, BaseLinkType<Prop>, false>;
  export function getOptionalLink<ResGroup extends ResourceGroup<PropertyMap, PropertyMap>, T, Prop extends PropertyDefinition<T>>(resources: ResGroup, accessor: (res: OutputsForResourceOrGroup<ResGroup>) => PropertyDefinition<T>, mode: ParentCreationMode, constraint?: LinkConstraint<ResGroup[0]>): LinkOfType<ResGroup[0], BaseLinkType<Prop>, false>;
  export {};

}
declare module '@haydenon/gen/resources/properties/properties' {
  import { LookupValues } from '@haydenon/gen/utilities/index';
  import { ErasedDesiredState } from '@haydenon/gen/resources/desired-state';
  import { PropertyMap, OutputValues, ResourceOrGroupItem } from '@haydenon/gen/resources/resource';
  import { RuntimeValue } from '@haydenon/gen/resources/runtime-values/index';
  import { ArrayConstraint, Constraint, DateConstraint, FloatConstraint, IntConstraint, StringConstraint, LinkConstraint } from '@haydenon/gen/resources/properties/constraints';
  import { ParentCreationMode } from '@haydenon/gen/resources/properties/links';
  export enum Type {
      Boolean = "Boolean",
      Int = "Int",
      Float = "Float",
      String = "String",
      Date = "Date",
      Nullable = "Nullable",
      Undefinable = "Undefinable",
      Array = "Array",
      Complex = "Complex",
      Link = "Link"
  }
  interface PropertyTypeBase {
      type: Type;
      constraint?: Constraint<any>;
  }
  export interface BooleanType extends PropertyTypeBase {
      type: Type.Boolean;
  }
  export interface IntType extends PropertyTypeBase {
      type: Type.Int;
      constraint?: IntConstraint;
  }
  export interface FloatType extends PropertyTypeBase {
      type: Type.Float;
      constraint?: FloatConstraint;
  }
  export interface StringType extends PropertyTypeBase {
      type: Type.String;
      constraint?: StringConstraint;
  }
  export interface DateType extends PropertyTypeBase {
      type: Type.Date;
      constraint?: DateConstraint;
  }
  export interface ArrayType extends PropertyTypeBase {
      type: Type.Array;
      inner: PropertyType;
      constraint?: ArrayConstraint<unknown>;
  }
  export interface Nullable extends PropertyTypeBase {
      type: Type.Nullable;
      inner: PropertyType;
  }
  export interface Undefinable extends PropertyTypeBase {
      type: Type.Undefinable;
      inner: PropertyType;
  }
  export interface ComplexType extends PropertyTypeBase {
      type: Type.Complex;
      fields: {
          [name: string]: PropertyType;
      };
  }
  export interface LinkOfType<Res extends ResourceOrGroupItem<PropertyMap, PropertyMap>, T, Required extends boolean> {
      type: Type.Link;
      inner: T;
      required: Required;
      resources: Res[];
      outputKey: string;
      constraint?: LinkConstraint<any>;
  }
  export interface LinkType<Parent extends ResourceOrGroupItem<PropertyMap, PropertyMap>> extends PropertyTypeBase {
      type: Type.Link;
      constraint?: LinkConstraint<any>;
      inner: PropertyType;
      required: boolean;
      resources: Parent[];
      outputKey: string;
      mode?: ParentCreationMode;
  }
  export type PropertyType = BooleanType | FloatType | IntType | StringType | DateType | ArrayType | Nullable | Undefinable | ComplexType | LinkType<any>;
  export const isBool: (type: PropertyType) => type is BooleanType;
  export const isFloat: (type: PropertyType) => type is FloatType;
  export const isInt: (type: PropertyType) => type is IntType;
  export const isDate: (type: PropertyType) => type is DateType;
  export const isStr: (type: PropertyType) => type is StringType;
  export const isNullable: (type: PropertyType) => type is Nullable;
  export const isUndefinable: (type: PropertyType) => type is Undefinable;
  export const isArray: (type: PropertyType) => type is ArrayType;
  export const isComplex: (type: PropertyType) => type is ComplexType;
  type NonUndefined<T> = null extends T ? NonNullable<T> | null : NonNullable<T>;
  type NonNull<T> = undefined extends T ? NonNullable<T> | undefined : NonNullable<T>;
  export type PropertyTypeForValue<T> = null extends T ? {
      type: Type.Nullable;
      inner: PropertyTypeForValue<NonNull<T>>;
  } : undefined extends T ? {
      type: Type.Undefinable;
      inner: PropertyTypeForValue<NonUndefined<T>>;
  } | LinkOfType<any, StringType, false> | LinkOfType<any, IntType, false> : T extends (infer Type)[] ? {
      type: Type.Array;
      inner: PropertyTypeForValue<Type>;
  } : T extends Date ? DateType : T extends object ? {
      type: Type.Complex;
      fields: {
          [K in keyof T]: PropertyTypeForValue<T[K]>;
      };
  } : T extends string ? StringType | LinkOfType<any, StringType, true> : T extends number ? IntType | FloatType | LinkOfType<any, IntType, true> : T extends boolean ? BooleanType : never;
  export type TypeForProperty<T> = T extends PropertyDefinition<infer Type> ? Type : never;
  interface CreatedStateForDesired {
      desiredState: ErasedDesiredState;
      createdState: OutputValues<PropertyMap>;
  }
  export interface CreatedState {
      [desiredStateName: string]: CreatedStateForDesired;
  }
  export type Value<T> = T | RuntimeValue<T>;
  export interface PropertyDefinition<T> {
      type: PropertyTypeForValue<T>;
  }
  export function def<T>(type: PropertyTypeForValue<T>): PropertyDefinition<T>;
  export function lookup<Prop extends PropertyType>(property: Prop, values: LookupValues<TypeForProperty<Prop>>): Prop;
  export function bool(constraint?: Constraint<boolean>): BooleanType;
  export function int(constraint?: IntConstraint): IntType;
  export function float(constraint?: FloatConstraint): FloatType;
  export function string(constraint?: Constraint<string>): StringType;
  export function date(constraint?: Constraint<Date>): DateType;
  export function array<Prop extends PropertyType>(prop: Prop, constraint?: Constraint<Prop[]>): {
      type: Type.Array;
      inner: Prop;
      constraint?: ArrayConstraint<unknown>;
  };
  type ComplexFields<T> = {
      [F in keyof T]: PropertyTypeForValue<T[F]>;
  };
  export function complex<T>(fields: ComplexFields<T>, constraint?: Constraint<T>): {
      type: Type.Complex;
      fields: ComplexFields<T>;
      constraint?: Constraint<any>;
  };
  export function nullable<Prop extends PropertyType>(prop: Prop): {
      type: Type.Nullable;
      inner: Prop;
  };
  export function undefinable<Prop extends PropertyType>(prop: Prop): {
      type: Type.Undefinable;
      inner: Prop;
  };
  export function nullOrUndefinable<Prop extends PropertyType>(prop: Prop): {
      type: Type.Nullable;
      inner: {
          type: Type.Undefinable;
          inner: Prop;
      };
  };
  export {};

}
declare module '@haydenon/gen/resources/properties/property-visitor' {
  import { PropertyType, BooleanType, IntType, FloatType, StringType, DateType, ArrayType, Nullable, Undefinable, ComplexType, LinkType } from '@haydenon/gen/resources/properties/properties';
  export function acceptPropertyType<T>(visitor: PropertyTypeVisitor<T>, type: PropertyType): T;
  export interface PropertyTypeVisitor<T> {
      visitBool: (type: BooleanType) => T;
      visitInt: (type: IntType) => T;
      visitFloat: (type: FloatType) => T;
      visitStr: (type: StringType) => T;
      visitDate: (type: DateType) => T;
      visitArray: (type: ArrayType) => T;
      visitNull: (type: Nullable) => T;
      visitUndefined: (type: Undefinable) => T;
      visitComplex: (type: ComplexType) => T;
      visitLink: (type: LinkType<any>) => T;
  }
  export abstract class ValueAndPropertyVisitor<T> implements PropertyTypeVisitor<T> {
      private value;
      constructor(value: any);
      visitBool: (type: BooleanType) => T;
      visitInt: (type: IntType) => T;
      visitFloat: (type: FloatType) => T;
      visitStr: (type: StringType) => T;
      visitDate: (type: DateType) => T;
      visitArray: (type: ArrayType) => T;
      visitNull: (type: Nullable) => T;
      visitUndefined: (type: Undefinable) => T;
      visitComplex: (type: ComplexType) => T;
      visitLink: (type: LinkType<any>) => T;
      protected abstract visitBoolValue: (type: BooleanType, value: any) => T;
      protected abstract visitIntValue: (type: IntType, value: any) => T;
      protected abstract visitFloatValue: (type: FloatType, value: any) => T;
      protected abstract visitStrValue: (type: StringType, value: any) => T;
      protected abstract visitDateValue: (type: DateType, value: any) => T;
      protected abstract mapNullValue: (type: Nullable) => T;
      protected abstract mapUndefinedValue: (type: Undefinable) => T;
      protected abstract mapLink?: (type: LinkType<any>, innerValue: T) => T;
      protected abstract checkArrayValue?: (type: ArrayType, value: any) => [true, T] | [false];
      protected abstract onEnteringArrayValue?: (type: ArrayType, value: any, index: number) => void;
      protected abstract onExitingArrayValue?: (type: ArrayType, value: any, index: number) => void;
      protected abstract mapArrayValue: (type: ArrayType, value: T[]) => T;
      protected abstract checkComplexValue?: (type: ComplexType, value: any) => [true, T] | [false];
      protected abstract onEnteringComplexValue?: (type: ComplexType, value: any, field: string) => void;
      protected abstract onExitingComplexValue?: (type: ComplexType, value: any, field: string) => void;
      protected abstract mapComplexValue: (type: ComplexType, value: {
          [key: string]: T;
      }) => T;
  }

}
declare module '@haydenon/gen/resources/properties/validation' {
  import { InputValues, PropertyMap, PropertyValues } from '@haydenon/gen/resources/resource';
  import { RuntimeValue } from '@haydenon/gen/resources/runtime-values/index';
  import { PropertyDefinition, PropertyType } from '@haydenon/gen/resources/properties/properties';
  export type RuntimeValueValidator = (propType: PropertyType, value: RuntimeValue<any>) => Error | undefined;
  export const getBaseError: (name: string, inputSegments: string[]) => string;
  export function validateInputValues(name: string, properties: PropertyMap, values: PropertyValues<PropertyMap>, validateRuntimeValue: RuntimeValueValidator): InputValues<PropertyMap> | Error[];
  export function validateInputValue(name: string, input: string, property: PropertyDefinition<any>, value: any, validateRuntimeValue: RuntimeValueValidator): any;

}
declare module '@haydenon/gen/resources/resource' {
  import { PropertyDefinition } from '@haydenon/gen/resources/properties/properties';
  import { RuntimeValue } from '@haydenon/gen/resources/runtime-values/index';
  export interface PropertyMap {
      [name: string]: PropertyDefinition<unknown>;
  }
  export type PropertyValueType<Prop> = Prop extends PropertyDefinition<infer Type> ? Type : never;
  export type PropertyValues<Props extends PropertyMap> = {
      [P in keyof Props]: PropertyValueType<Props[P]> | RuntimeValue<PropertyValueType<Props[P]>>;
  };
  export type ResolvedPropertyValues<Props extends PropertyMap> = {
      [P in keyof Props]: PropertyValueType<Props[P]>;
  };
  export type RemoveIndex<T> = {
      [K in keyof T as string extends K ? never : number extends K ? never : K]: T[K];
  };
  export type InputValues<Props extends PropertyMap> = RemoveIndex<PropertyValues<Props>>;
  export type OutputValues<Props extends PropertyMap> = RemoveIndex<ResolvedPropertyValues<Props>>;
  export abstract class PropertiesBase implements PropertyMap {
      [name: string]: PropertyDefinition<any>;
  }
  export interface ResourceGroupItem<Inputs extends PropertyMap, Outputs extends PropertyMap> {
      inputs: Inputs;
      outputs: Outputs;
      create(inputs: any): Promise<any>;
  }
  export abstract class Resource<Inputs extends PropertyMap, Outputs extends PropertyMap> {
      inputs: Inputs;
      outputs: Outputs;
      constructor(inputs: Inputs, outputs: Outputs);
      abstract create(inputs: ResolvedPropertyValues<Inputs>): Promise<OutputValues<Outputs>>;
      createTimeoutMillis?: number;
  }
  export type ResourceGroup<In extends PropertyMap, Out extends PropertyMap> = ResourceGroupItem<In, Out>[];
  export interface ResourceOrGroupItem<Inputs extends PropertyMap, Outputs extends PropertyMap> {
      inputs: Inputs;
      outputs: Outputs;
  }

}
declare module '@haydenon/gen/resources/runtime-values/ast/expressions' {
  import { ExprType } from '@haydenon/gen/resources/runtime-values/types/expression-types';
  import { Token } from '@haydenon/gen/resources/runtime-values/ast/tokens/token';
  export interface Visitor<R> {
      visitLiteralExpr(expr: Literal): R;
      visitArrayConstructorExpr(expr: ArrayConstructor): R;
      visitObjectConstructorExpr(expr: ObjectConstructor): R;
      visitVariableExpr(expr: Variable): R;
      visitCallExpr(expr: Call): R;
      visitGetExpr(expr: GetProp): R;
      visitFormatString(expr: FormatString): R;
      visitFunctionExpr(expr: FunctionValue): R;
  }
  export abstract class Expr {
      abstract accept: <R>(visitor: Visitor<R>) => R;
  }
  export class Variable extends Expr {
      name: Token;
      constructor(name: Token);
      accept: <R>(visitor: Visitor<R>) => R;
  }
  export class GetProp extends Expr {
      obj: Expr;
      indexer: Expr;
      constructor(obj: Expr, indexer: Expr);
      accept: <R>(visitor: Visitor<R>) => R;
  }
  export class Literal extends Expr {
      value: any;
      constructor(value: any);
      accept: <R>(visitor: Visitor<R>) => R;
  }
  export class ArrayConstructor extends Expr {
      items: Expr[];
      constructor(items: Expr[]);
      accept: <R>(visitor: Visitor<R>) => R;
  }
  export class ObjectConstructor extends Expr {
      fields: [Token, Expr][];
      constructor(fields: [Token, Expr][]);
      accept: <R>(visitor: Visitor<R>) => R;
  }
  export class Call extends Expr {
      callee: Expr;
      args: Expr[];
      constructor(callee: Expr, args: Expr[]);
      accept: <R>(visitor: Visitor<R>) => R;
  }
  export class FormatString extends Expr {
      strings: Literal[];
      expressions: Expr[];
      constructor(strings: Literal[], expressions: Expr[]);
      accept: <R>(visitor: Visitor<R>) => R;
  }
  export interface Signature {
      parameters: ExprType[];
      returnType: ExprType;
  }
  export class FunctionValue extends Expr {
      func: (...args: any[]) => any;
      signatures?: Signature[] | undefined;
      constructor(func: (...args: any[]) => any, signatures?: Signature[] | undefined);
      accept: <R>(visitor: Visitor<R>) => R;
  }

}
declare module '@haydenon/gen/resources/runtime-values/ast/parser' {
  import { RuntimeValue } from '@haydenon/gen/resources/runtime-values/runtime-values';
  export class Parser {
      private source;
      private dependentStateNames;
      private tokens;
      private current;
      constructor(source: string);
      parse(): RuntimeValue<any>;
      private expression;
      private call;
      private primary;
      private match;
      private check;
      private advance;
      private isAtEnd;
      private peek;
      private previous;
      private consume;
      private error;
  }
  export const parse: (expression: string) => RuntimeValue<any> | Error;

}
declare module '@haydenon/gen/resources/runtime-values/ast/tokens/token-types' {
  export enum TokenType {
      LEFT_PAREN = "LEFT_PAREN",
      RIGHT_PAREN = "RIGHT_PAREN",
      LEFT_SQUARE = "LEFT_SQUARE",
      RIGHT_SQUARE = "RIGHT_SQUARE",
      COMMA = "COMMA",
      DOT = "DOT",
      MINUS = "MINUS",
      PLUS = "PLUS",
      COLON = "COLON",
      SLASH = "SLASH",
      STAR = "STAR",
      QUESTION_MARK = "QUESTION_MARK",
      BANG = "BANG",
      BANG_EQUAL = "BANG_EQUAL",
      EQUAL = "EQUAL",
      EQUAL_EQUAL = "EQUAL_EQUAL",
      GREATER = "GREATER",
      GREATER_EQUAL = "GREATER_EQUAL",
      LESS = "LESS",
      LESS_EQUAL = "LESS_EQUAL",
      AMPER_AMPER = "AMPER_AMPER",
      PIPE_PIPE = "PIPE_PIPE",
      IDENTIFIER = "IDENTIFIER",
      STRING = "STRING",
      NUMBER = "NUMBER",
      TRUE = "TRUE",
      FALSE = "FALSE",
      NULL = "NULL",
      EOF = "EOF"
  }

}
declare module '@haydenon/gen/resources/runtime-values/ast/tokens/token' {
  import { TokenType } from '@haydenon/gen/resources/runtime-values/ast/tokens/token-types';
  export interface Token {
      type: TokenType;
      lexeme: string;
      literal?: any;
  }
  export const plain: (type: TokenType, lexeme: string) => Token;
  export const identifier: (lexeme: string) => Token;
  export const value: (type: TokenType, lexeme: string, literal: any) => Token;

}
declare module '@haydenon/gen/resources/runtime-values/ast/tokens/tokenizer' {
  import { Token } from '@haydenon/gen/resources/runtime-values/ast/tokens/token';
  export class Tokenizer {
      private source;
      private start;
      private current;
      private tokens;
      constructor(source: string);
      scanTokens(): Token[];
      private keywords;
      private charHandlers;
      private scanToken;
      private identifier;
      private string;
      private number;
      private advance;
      private match;
      private peek;
      private peekNext;
      private isAtEnd;
      private addToken;
  }

}
declare module '@haydenon/gen/resources/runtime-values/evaluator/evaluator' {
  import { CreatedState } from '@haydenon/gen/resources/properties/properties';
  import { Expr } from '@haydenon/gen/resources/runtime-values/ast/expressions';
  export function evaluate<T>(expression: Expr, createdState: CreatedState): T;

}
declare module '@haydenon/gen/resources/runtime-values/index' {
  export { RuntimeValue, isRuntimeValue, mapValue, mapValues, getRuntimeResourceValue, } from '@haydenon/gen/resources/runtime-values/runtime-values';

}
declare module '@haydenon/gen/resources/runtime-values/outputer/outputer' {
  import { Expr } from '@haydenon/gen/resources/runtime-values/ast/expressions';
  import { RuntimeValue } from '@haydenon/gen/resources/runtime-values/runtime-values';
  export function outputExpression(expression: Expr): string;
  export function outputRuntimeValue<T>(value: RuntimeValue<T>): string;

}
declare module '@haydenon/gen/resources/runtime-values/runtime-values' {
  import { DesiredState } from '@haydenon/gen/resources/desired-state';
  import { CreatedState, Value } from '@haydenon/gen/resources/properties/properties';
  import { Resource, PropertyMap, OutputValues, PropertyValueType } from '@haydenon/gen/resources/resource';
  import { Expr } from '@haydenon/gen/resources/runtime-values/ast/expressions';
  export class RuntimeValue<T> {
      depdendentStateNames: string[];
      expression: Expr;
      constructor(depdendentStateNames: string[], expression: Expr);
      evaluate(createdState: CreatedState): T;
  }
  export function isRuntimeValue<T>(value: T | RuntimeValue<T>): value is RuntimeValue<T>;
  export function mapValue<T, R>(value: Value<T>, mapper: (value: T) => R): Value<R>;
  export function mapValues<T extends any[], R>(values: {
      [I in keyof T]: Value<T[I]>;
  }, mapper: (...values: {
      [I in keyof T]: T[I];
  }) => R): Value<R>;
  export function getRuntimeResourceValue<Res extends Resource<PropertyMap, PropertyMap>, Key extends keyof OutputValues<Res['outputs']> & keyof Res['outputs']>(item: DesiredState<Res>, key: Key): RuntimeValue<PropertyValueType<Res['outputs'][Key]>>;

}
declare module '@haydenon/gen/resources/runtime-values/types/expre-type.outputter' {
  import { ExprType } from '@haydenon/gen/resources/runtime-values/types/expression-types';
  export function outputExprType(type: ExprType): string;

}
declare module '@haydenon/gen/resources/runtime-values/types/expression-types' {
  import { Signature } from '@haydenon/gen/resources/runtime-values/ast/expressions';
  export enum Type {
      Any = "Any",
      Unknown = "Unknown",
      Undefined = "Undefined",
      Null = "Null",
      Boolean = "Boolean",
      Number = "Number",
      String = "String",
      Date = "Date",
      Array = "Array",
      Object = "Object",
      Function = "Function",
      Union = "Union"
  }
  export type PrimativeType = Type.Boolean | Type.Number | Type.String | Type.Date;
  interface Any {
      type: Type.Any;
  }
  export const anyType: Any;
  interface Unknown {
      type: Type.Unknown;
  }
  export const unknownType: Unknown;
  interface Null {
      type: Type.Null;
  }
  export const nullType: Null;
  interface Undefined {
      type: Type.Undefined;
  }
  export const undefinedType: Undefined;
  interface Primative {
      type: PrimativeType;
  }
  export const primative: (type: PrimativeType) => Primative;
  interface Union {
      type: Type.Union;
      inner?: ExprType;
      undefined?: Undefined;
      null?: Null;
  }
  export const createUnion: (t1: ExprType, t2: ExprType) => ExprType;
  interface Array {
      type: Type.Array;
      inner: ExprType;
  }
  export const array: (inner: ExprType) => Array;
  interface Complex {
      type: Type.Object;
      fields: {
          [property: string]: ExprType;
      };
  }
  export const complex: (fields: {
      [property: string]: ExprType;
  }) => Complex;
  interface Func {
      type: Type.Function;
      signatures?: Signature[];
  }
  export const func: (signatures: Signature[] | undefined) => Func;
  export type ExprType = Any | Unknown | Null | Undefined | Primative | Union | Array | Complex | Func;
  export {};

}
declare module '@haydenon/gen/resources/runtime-values/types/inferrer/inferrer' {
  import { Expr } from '@haydenon/gen/resources/runtime-values/ast/expressions';
  import { ExprType } from '@haydenon/gen/resources/runtime-values/types/expression-types';
  export const unifyExpressions: (t1: ExprType, t2: ExprType) => ExprType;
  export const containsType: (actual: ExprType, expected: ExprType) => boolean;
  export function inferType(expression: Expr, context: {
      [name: string]: ExprType;
  }): ExprType | Error;

}
declare module '@haydenon/gen/resources/runtime-values/types/prop-expr-type.mappers' {
  import { PropertyType } from '@haydenon/gen/resources/properties/properties';
  import { ExprType } from '@haydenon/gen/resources/runtime-values/types/expression-types';
  export const mapPropTypeToExprType: (propType: PropertyType) => ExprType;

}
declare module '@haydenon/gen/resources/runtime-values/value-mapper' {
  import { Expr } from '@haydenon/gen/resources/runtime-values/ast/expressions';
  export const getValueExpr: (value: any) => Expr;

}
declare module '@haydenon/gen/resources/state-constraints' {
  import { ErasedDesiredState } from '@haydenon/gen/resources/desired-state';
  import { Value } from '@haydenon/gen/resources/properties/index';
  import { ParentCreationMode } from '@haydenon/gen/resources/properties/links';
  interface BaseConstraint {
      path: PropertyPathSegment[];
      value?: Value<any>;
      creationMode?: ParentCreationMode;
      ancestorConstraints?: BaseConstraint[];
  }
  interface BasicStateConstraint extends BaseConstraint {
      value: Value<any>;
      ancestorCreationMode?: undefined;
      creationMode?: undefined;
  }
  interface AncestorStateConstraint extends BaseConstraint {
      value?: undefined;
      ancestorConstraints: StateConstraint[];
      creationMode?: undefined;
  }
  interface StateCreationConstraint extends BaseConstraint {
      value?: undefined;
      ancestorConstraints?: undefined;
      creationMode: ParentCreationMode;
  }
  export type StateConstraint = BasicStateConstraint | AncestorStateConstraint | StateCreationConstraint;
  export interface BaseStateAndConstraints {
      state?: ErasedDesiredState;
      name?: string;
      constraints: StateConstraint[];
  }
  export interface NewStateAndConstraints extends BaseStateAndConstraints {
      state: ErasedDesiredState;
      name?: undefined;
  }
  export interface ExistingStateAndConstraints extends BaseStateAndConstraints {
      name: string;
      state?: undefined;
  }
  export type StateAndConstraints = NewStateAndConstraints | ExistingStateAndConstraints;
  enum PropertyPathType {
      PropertyAccess = 0,
      ArrayIndexAccess = 1
  }
  interface PropertyAccess {
      type: PropertyPathType.PropertyAccess;
      propertyName: string;
  }
  export const propAccess: (prop: string | symbol) => PropertyAccess;
  interface ArrayIndexAccess {
      type: PropertyPathType.ArrayIndexAccess;
      indexAccess: number | 'all';
  }
  export const arrayIndexAccess: (indexAccess: number | 'all') => ArrayIndexAccess;
  export type PropertyPathSegment = PropertyAccess | ArrayIndexAccess;
  export const pathMatches: (p1: PropertyPathSegment[], p2: PropertyPathSegment[]) => boolean;
  export {};

}
declare module '@haydenon/gen/server/gen-server' {
  import { Resource, PropertiesBase } from '@haydenon/gen/resources/index';
  interface ServerOptions {
      port?: number;
  }
  export class GenServer {
      private resources;
      private options;
      private mapper;
      constructor(resources: Resource<PropertiesBase, PropertiesBase>[], serverOptions?: ServerOptions);
      private sendErrors;
      run(): void;
  }
  export {};

}
declare module '@haydenon/gen/server/index' {
  export { GenServer } from '@haydenon/gen/server/gen-server';

}
declare module '@haydenon/gen/server/mapping/desired-state.mapper' {
  import { Resource } from '@haydenon/gen/resources/index';
  import { ErasedDesiredState } from '@haydenon/gen/resources/desired-state';
  import { PropertyMap } from '@haydenon/gen/resources/resource';
  import { ExprType } from '@haydenon/gen/resources/runtime-values/types/expression-types';
  import { StateItem } from '@haydenon/gen/server/models/state-requests';
  export type DesiredStateMapper = (item: StateItem, context: DesiredStateContext) => ErasedDesiredState | Error[];
  export interface DesiredStateContext {
      [desiredState: string]: ExprType;
  }
  export const getContextForDesiredState: (resources: Resource<PropertyMap, PropertyMap>[], context: StateItem[]) => DesiredStateContext | Error[];
  export function getMapper(resources: Resource<PropertyMap, PropertyMap>[]): DesiredStateMapper;

}
declare module '@haydenon/gen/server/mapping/runtime-value.mapper' {
  import { RuntimeValue } from '@haydenon/gen/resources/runtime-values/index';
  export function replaceRuntimeValueTemplates(value: unknown, parse: (expr: string) => RuntimeValue<any> | Error): [unknown, Error[]];

}
declare module '@haydenon/gen/server/models/state-requests' {
  export interface StateItem {
      _type: string;
      _name?: string;
  }
  export interface StateRequest {
      state: StateItem[];
  }
  export const isStateItem: (item: any) => item is StateItem;
  export const isStateRequest: (body: any) => body is StateRequest;

}
declare module '@haydenon/gen/server/models/state-responses' {
  import { ErasedDesiredState } from '@haydenon/gen/resources/desired-state';
  import { ErasedResourceInstance } from '@haydenon/gen/resources/instance';
  export interface DesiredStateItem {
      _name: string;
      _type: string;
      [property: string]: any;
  }
  export function mapDesiredStateToResponse(desired: ErasedDesiredState): DesiredStateItem;
  export interface CreatedStateItem {
      _name: string;
      _type: string;
      [property: string]: any;
  }
  export function mapResourceInstanceToResponse(instance: ErasedResourceInstance): CreatedStateItem;

}
declare module '@haydenon/gen/utilities/collection' {
  export function range(count: number): number[];
  export function range(min: number, max: number): number[];
  type EnumObject<T> = T extends number | string ? {
      [key: string]: number | string;
  } : never;
  export type LookupValues<T> = T[] | {
      [index: string]: T;
  } | EnumObject<T>;
  export const oneOf: <T>(values: LookupValues<T>) => T;
  export const isOneOf: <T>(values: LookupValues<T>, value: T) => boolean;
  export {};

}
declare module '@haydenon/gen/utilities/index' {
  export * from '@haydenon/gen/utilities/random';
  export * from '@haydenon/gen/utilities/collection';
  export * from '@haydenon/gen/utilities/string';

}
declare module '@haydenon/gen/utilities/random' {
  export const getRandomBool: () => boolean;
  export const getRandomInt: (min: number, max: number) => number;
  export const getRandomFloat: (min: number, max: number) => number;
  export const maybeUndefined: <T>(value: T | (() => T)) => T | undefined;
  export const maybeNull: <T>(value: T | (() => T)) => T | null;
  export const maybeNullOrUndefined: <T>(value: T | (() => T)) => T | null | undefined;

}
declare module '@haydenon/gen/utilities/string' {
  export const truncate: (str: string, length: number) => string;

}
declare module '@haydenon/gen' {
  import main = require('@haydenon/gen/index');
  export = main;
}