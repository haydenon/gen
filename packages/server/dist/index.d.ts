declare module '@haydenon/gen-server/index' {
  export * from '@haydenon/gen-server/server/index';

}
declare module '@haydenon/gen-server/server/gen-server' {
  import { Resource, PropertiesBase } from '@haydenon/gen-core';
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
declare module '@haydenon/gen-server/server/index' {
  export { GenServer } from '@haydenon/gen-server/server/gen-server';

}
declare module '@haydenon/gen-server/server/mapping/desired-state.mapper' {
  import { Resource, ErasedDesiredState, ExprType, PropertyMap } from '@haydenon/gen-core';
  import { StateItem } from '@haydenon/gen-server/server/models/state-requests';
  export type DesiredStateMapper = (item: StateItem, context: DesiredStateContext) => ErasedDesiredState | Error[];
  export interface DesiredStateContext {
      [desiredState: string]: ExprType;
  }
  export const getContextForDesiredState: (resources: Resource<PropertyMap, PropertyMap>[], context: StateItem[]) => DesiredStateContext | Error[];
  export function getMapper(resources: Resource<PropertyMap, PropertyMap>[]): DesiredStateMapper;

}
declare module '@haydenon/gen-server/server/mapping/runtime-value.mapper' {
  import { RuntimeValue } from '@haydenon/gen-core/src/resources/runtime-values';
  export function replaceRuntimeValueTemplates(value: unknown, parse: (expr: string) => RuntimeValue<any> | Error): [unknown, Error[]];

}
declare module '@haydenon/gen-server/server/models/state-requests' {
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
declare module '@haydenon/gen-server/server/models/state-responses' {
  import { ErasedDesiredState } from '@haydenon/gen-core/src/resources/desired-state';
  import { ErasedResourceInstance } from '@haydenon/gen-core/src/resources/instance';
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
declare module '@haydenon/gen-server' {
  import main = require('@haydenon/gen-server/src/index');
  export = main;
}