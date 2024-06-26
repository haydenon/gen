import { InputValues, PropertyMap, PropertyValues } from '../resource';
import { isRuntimeValue, RuntimeValue } from '../runtime-values';
import {
  BaseConstraint,
  Constraint,
  getValidationLimitValue,
} from './constraints';
import {
  ArrayType,
  BooleanType,
  ComplexType,
  DateType,
  FloatType,
  IntType,
  PropertyDefinition,
  PropertyType,
  StringType,
  Type,
  Undefinable,
} from './properties';
import {
  ValueAndPropertyVisitor,
  acceptPropertyType,
} from './property-visitor';

export type RuntimeValueValidator = (
  propType: PropertyType,
  value: RuntimeValue<any>
) => Error | undefined;

export const getBaseError = (name: string, inputSegments: string[]) =>
  `Input '${inputSegments.join('')}' for '${name}'`;

export function validateInputValues(
  name: string,
  properties: PropertyMap,
  values: PropertyValues<PropertyMap>,
  validateRuntimeValue: RuntimeValueValidator
): InputValues<PropertyMap> | Error[] {
  const propertyKeys = Object.keys(properties);

  const [validated, errors] = propertyKeys.reduce(
    ([acc, errors], key) => {
      if (!(key in values)) {
        return [acc, errors];
      }

      const result = validateInputValue(
        name,
        key,
        properties[key],
        values[key],
        validateRuntimeValue
      );
      if (result instanceof Error) {
        return [acc, [...errors, result]];
      } else {
        acc[key] = result;
        return [acc, errors];
      }
    },
    [{}, []] as [PropertyValues<PropertyMap>, Error[]]
  );

  if (errors.length > 0) {
    return errors;
  }

  return validated;
}

class ValidateInputVisitor extends ValueAndPropertyVisitor<any> {
  private inputSegments: string[];

  constructor(
    value: any,
    private name: string,
    input: string,
    private validateRuntimeValue: RuntimeValueValidator
  ) {
    super(value);
    this.inputSegments = [input];
  }

  private getBaseError = () => getBaseError(this.name, this.inputSegments);

  private checkValue(
    propType: PropertyType,
    value: any,
    // eslint-disable-next-line @typescript-eslint/ban-types
    valueType: string | Function,
    length?: (value: any) => number
  ): any {
    if (isRuntimeValue(value)) {
      const runtimeResult = this.validateRuntimeValue(propType, value);
      if (runtimeResult instanceof Error) {
        throw new Error(
          `${this.getBaseError()} runtime value error: ${runtimeResult.message}`
        );
      }
      return value;
    }

    const isValidType =
      typeof valueType === 'string'
        ? typeof value === valueType
        : value instanceof valueType;

    const typeString =
      typeof valueType === 'string' ? valueType : valueType.name;

    if (!isValidType) {
      throw new Error(`${this.getBaseError()} is not of type '${typeString}'`);
    }

    const unknownConstraint = propType.constraint as BaseConstraint<any>;
    if (!unknownConstraint) {
      return value;
    }
    if (unknownConstraint.isValid && !unknownConstraint.isValid(value)) {
      throw new Error(
        `${this.getBaseError()} does not pass custom validation rules`
      );
    }

    let min: number | undefined = undefined;
    let max: number | undefined = undefined;
    switch (propType.type) {
      case Type.Boolean:
        return value;
      case Type.Int: {
        const numConstraint = unknownConstraint as Constraint<number>;
        min = getValidationLimitValue(numConstraint.min);
        max = getValidationLimitValue(numConstraint.max);
        break;
      }
      case Type.Float: {
        const numConstraint = unknownConstraint as Constraint<number>;
        if (numConstraint.precision) {
          const diff = (value * (1 / numConstraint.precision)) % 1;
          if (diff > 0.01) {
            // TODO: Validate this works
            throw new Error(
              `${this.getBaseError()} has invalid floating precision`
            );
          }
        }
        min = getValidationLimitValue(numConstraint.min);
        max = getValidationLimitValue(numConstraint.max);
        break;
      }
      case Type.String: {
        const strConstraint = unknownConstraint as Constraint<string>;
        min = getValidationLimitValue(strConstraint.minLength);
        max = getValidationLimitValue(strConstraint.maxLength);
        break;
      }
      case Type.Date: {
        const dateConstraint = unknownConstraint as Constraint<Date>;
        min = getValidationLimitValue(dateConstraint.minDate)?.getTime();
        max = getValidationLimitValue(dateConstraint.maxDate)?.getTime();
        break;
      }
      case Type.Array: {
        const arrConstraint = unknownConstraint as Constraint<any[]>;
        min = getValidationLimitValue(arrConstraint.minItems);
        max = getValidationLimitValue(arrConstraint.maxItems);
        break;
      }
    }

    if (min !== undefined && length && length(value) < min) {
      throw new Error(
        `${this.getBaseError()} is smaller than a min value of ${min}`
      );
    } else if (max !== undefined && length && length(value) > max) {
      throw new Error(
        `${this.getBaseError()} is larger than a max value of ${max}`
      );
    }

    return value;
  }

  visitBoolValue = (type: BooleanType, value: any) => {
    return this.checkValue(type, value, 'boolean');
  };
  visitIntValue = (type: IntType, value: any) => {
    if (typeof value === 'number' && Math.abs(value) % 1 !== 0) {
      throw new Error(`${this.getBaseError()} is not an integer`);
    }
    return this.checkValue(type, value, 'number', (num) => num);
  };
  visitFloatValue = (type: FloatType, value: any) => {
    return this.checkValue(type, value, 'number', (num) => num);
  };
  visitStrValue = (type: StringType, value: any) => {
    return this.checkValue(type, value, 'string', (str) => str.length);
  };
  visitDateValue = (type: DateType, value: any) => {
    return this.checkValue(type, value, Date, (date) => date.getTime());
  };

  checkArrayValue = (type: ArrayType, value: any): [true, any] | [false] => {
    if (isRuntimeValue(value)) {
      return [true, value];
    }

    this.checkValue(type, value, Array, (arr) => arr.length);
    return [false];
  };
  mapArrayValue = (_: ArrayType, value: any[]): any => value;

  mapNullValue = () => null;
  mapUndefinedValue = () => undefined;

  checkComplexValue = (_: ComplexType, value: any): [true, any] | [false] =>
    isRuntimeValue(value) ? [true, value] : [false];
  mapComplexValue = (_: ComplexType, value: { [key: string]: any }) => value;

  protected onEnteringArrayValue = (type: any, value: any, index: number) =>
    this.inputSegments.push(`[${index}]`);
  protected onExitingArrayValue = () => {
    this.inputSegments.pop();
  };
  protected onEnteringComplexValue = (type: any, value: any, field: string) =>
    this.inputSegments.push(`.${field}`);
  protected onExitingComplexValue = () => {
    this.inputSegments.pop();
  };

  protected mapLink = undefined;
}

export function validateInputValue(
  name: string,
  input: string,
  property: PropertyDefinition<any>,
  value: any,
  validateRuntimeValue: RuntimeValueValidator
): any {
  const visitor = new ValidateInputVisitor(
    value,
    name,
    input,
    validateRuntimeValue
  );
  try {
    return acceptPropertyType(visitor, property.type);
  } catch (err) {
    return err as Error;
  }
}
