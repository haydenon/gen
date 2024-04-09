import { GenerationContext } from '../generator';
import { PropertyDefinition } from './properties/properties';
import { RuntimeValue } from './runtime-values';
import { BASE_CONTEXT } from './runtime-values/context/base-context';
import { PropertyPathType, getPathFromAccessor } from './utilities/proxy-path';

export interface PropertyMap {
  [name: string]: PropertyDefinition<unknown>;
}

export type PropertyValueType<Prop> = Prop extends PropertyDefinition<
  infer Type
>
  ? Type
  : never;

export type PropertyValues<Props extends PropertyMap> = {
  [P in keyof Props]:
    | PropertyValueType<Props[P]>
    | RuntimeValue<PropertyValueType<Props[P]>>;
};

export type ResolvedValues<Props extends PropertyMap> = {
  [P in keyof Props]: PropertyValueType<Props[P]>;
};

export type RemoveIndex<T> = {
  [K in keyof T as string extends K
    ? never
    : number extends K
    ? never
    : K]: T[K];
};

export type InputValues<Props extends PropertyMap> = RemoveIndex<
  PropertyValues<Props>
>;

export type OutputValues<Props extends PropertyMap> = RemoveIndex<
  ResolvedValues<Props>
>;

export abstract class PropertiesBase implements PropertyMap {
  [name: string]: PropertyDefinition<any>;
}

export interface ResourceGroupItem<
  Inputs extends PropertyMap,
  Outputs extends PropertyMap
> {
  name: string;
  inputs: Inputs;
  outputs: Outputs;

  create(inputs: any, context: GenerationContext): Promise<any>;
}

export abstract class Resource<
  Inputs extends PropertyMap,
  Outputs extends PropertyMap
> {
  public name: string;
  public identifierProperty: string;
  constructor(
    public inputs: Inputs,
    public outputs: Outputs,
    identifierAccessor: (outputs: OutputValues<Outputs>) => any,
    name?: string
  ) {
    this.name = name ?? this.constructor.name;
    const identifierPath = getPathFromAccessor(identifierAccessor);
    if (
      identifierPath.length != 1 ||
      identifierPath[0].type !== PropertyPathType.PropertyAccess
    ) {
      throw new Error('Identifier should be direct property on outputs');
    }

    this.identifierProperty = identifierPath[0].propertyName;
  }
  abstract create(
    inputs: ResolvedValues<Inputs>,
    context?: GenerationContext
  ): Promise<OutputValues<Outputs>>;
  createTimeoutMillis?: number;
}

export abstract class ResourceGroup<
  In extends PropertyMap,
  Out extends PropertyMap
> {
  public name: string;
  constructor(public items: ResourceGroupItem<In, Out>[], name?: string) {
    this.name = name ?? this.constructor.name;
  }
}

export interface ResourceOrGroupItem<
  Inputs extends PropertyMap,
  Outputs extends PropertyMap
> {
  name: string;
  inputs: Inputs;
  outputs: Outputs;
}

const NAME_REGEX = /[a-zA-Z_]+[0-9a-zA-Z_]*/;

export function validateResourceName(name?: string): Error | undefined {
  if (!name) {
    return;
  }

  const contextNames = Object.keys(BASE_CONTEXT);
  if (contextNames.includes(name)) {
    return new Error(`Name '${name}' is already defined in base context`);
  }

  if (!NAME_REGEX.test(name)) {
    return new Error(
      `Can only contain alphanumeric, underscores, and can't start with a number`
    );
  }

  return undefined;
}
