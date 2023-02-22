import { ErasedDesiredState } from '@haydenon/gen-core/src/resources/desired-state';
import { ErasedResourceInstance } from '@haydenon/gen-core/src/resources/instance';
import {
  ArrayType,
  ComplexType,
} from '@haydenon/gen-core/src/resources/properties/properties';
import {
  acceptPropertyType,
  ValueAndPropertyVisitor,
} from '@haydenon/gen-core/src/resources/properties/property-visitor';
import { PropertyMap } from '@haydenon/gen-core/src/resources/resource';
import { isRuntimeValue } from '@haydenon/gen-core/src/resources/runtime-values/index';
import { outputRuntimeValue } from '@haydenon/gen-core/src/resources/runtime-values/outputer/outputer';

const specialKeys = ['_type', '_name'];

const removeSpecialFields = (
  value: {
    [property: string]: any;
  },
  propertiesForRuntimeReplacement?: PropertyMap
): { [property: string]: any } => {
  return Object.keys(value).reduce((acc, key) => {
    if (specialKeys.includes(key)) {
      return acc;
    }

    if (propertiesForRuntimeReplacement) {
      const runtimeOutputVisitor = new RuntimeOutputVisitor(value[key]);
      acc[key] = acceptPropertyType(
        runtimeOutputVisitor,
        propertiesForRuntimeReplacement[key].type
      );
    } else {
      acc[key] = value[key];
    }
    return acc;
  }, {} as { [property: string]: any });
};

export interface DesiredStateItem {
  _name: string;
  _type: string;
  [property: string]: any;
}

class RuntimeOutputVisitor extends ValueAndPropertyVisitor<any> {
  private replaceRuntimeValue = (_: any, value: any) =>
    isRuntimeValue(value) ? `$\{${outputRuntimeValue(value)}}` : value;
  protected visitBoolValue = this.replaceRuntimeValue;
  protected visitIntValue = this.replaceRuntimeValue;
  protected visitFloatValue = this.replaceRuntimeValue;
  protected visitStrValue = this.replaceRuntimeValue;
  protected visitDateValue = this.replaceRuntimeValue;
  protected mapNullValue = () => null;
  protected mapUndefinedValue = () => '${undefined}';
  protected checkArrayValue = (_: any, value: any): [true, any] | [false] =>
    isRuntimeValue(value)
      ? [true, `$\{${outputRuntimeValue(value)}}`]
      : [false];
  protected mapArrayValue = (type: ArrayType, value: any[]) => value;
  protected checkComplexValue = (_: any, value: any): [true, any] | [false] =>
    isRuntimeValue(value)
      ? [true, `$\{${outputRuntimeValue(value)}}`]
      : [false];
  protected mapComplexValue = (
    type: ComplexType,
    value: { [key: string]: any }
  ) => value;

  protected onEnteringArrayValue = undefined;
  protected onExitingArrayValue = undefined;
  protected onEnteringComplexValue = undefined;
  protected onExitingComplexValue = undefined;
  protected mapLink = undefined;
}

export function mapDesiredStateToResponse(
  desired: ErasedDesiredState
): DesiredStateItem {
  return {
    _name: desired.name,
    _type: desired.resource.name,
    ...removeSpecialFields(desired.inputs, desired.resource.inputs),
  };
}

export interface CreatedStateItem {
  _name: string;
  _type: string;
  [property: string]: any;
}

export function mapResourceInstanceToResponse(
  instance: ErasedResourceInstance
): CreatedStateItem {
  return {
    _name: instance.desiredState.name,
    _type: instance.desiredState.resource.name,
    ...removeSpecialFields(instance.outputs),
  };
}
