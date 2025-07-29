import { TreeNode, Type } from '@haydenon/gen-core';

export interface ConstraintResponse {
  tree?: TreeNode<any>;
  validValues?: any[];
  hasValidator: boolean;
  hasGenerator: boolean;
  min?: number;
  max?: number;
  float?: boolean;
  precision?: number;
  minDate?: number;
  maxDate?: number;
  minLength?: number;
  maxLength?: number;
  minItems?: number;
  maxItems?: number;
}

interface PropertyTypeResponseBase {
  type: Type;
  constraint?: ConstraintResponse;
}

export interface BasicTypeResponse extends PropertyTypeResponseBase {
  type: Type.Boolean | Type.Int | Type.Float | Type.String | Type.Date;
}

export interface ArrayTypeResponse extends PropertyTypeResponseBase {
  type: Type.Array;
  inner: PropertyTypeResponse;
}

export interface NullableTypeResponse extends PropertyTypeResponseBase {
  type: Type.Nullable;
  inner: PropertyTypeResponse;
}

export interface UndefinableTypeResponse extends PropertyTypeResponseBase {
  type: Type.Undefinable;
  inner: PropertyTypeResponse;
}

export interface ComplexTypeResponse extends PropertyTypeResponseBase {
  type: Type.Complex;
  fields: { [name: string]: PropertyTypeResponse };
}

export interface LinkTypeResponse extends PropertyTypeResponseBase {
  type: Type.Link;
  inner: PropertyTypeResponse;
  required: boolean;
  resources: string[];
  outputField: string;
}

export type PropertyTypeResponse =
  | BasicTypeResponse
  | ArrayTypeResponse
  | NullableTypeResponse
  | UndefinableTypeResponse
  | ComplexTypeResponse
  | LinkTypeResponse;

export interface PropertyDefinitionResponse {
  name: string;
  type: PropertyTypeResponse;
}

export interface PropertyMapResponse {
  [name: string]: PropertyDefinitionResponse;
}

export interface ResourceResponse {
  name: string;
  inputs: PropertyMapResponse;
  outputs: PropertyMapResponse;
}
