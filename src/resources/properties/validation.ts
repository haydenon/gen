import { InputValues, PropertyMap, PropertyValues } from '../resource';
import {
  acceptPropertyType,
  ArrayType,
  BaseConstraint,
  BooleanType,
  ComplexType,
  Constraint,
  DateType,
  FloatType,
  IntType,
  PropertyDefinition,
  PropertyType,
  StringType,
  Type,
  ValueAndPropertyVisitor,
} from './properties';

export const getBaseError = (name: string, input: string) =>
  `Input value '${input}' for '${name}'`;

export function validateInputValues(
  name: string,
  properties: PropertyMap,
  values: PropertyValues<PropertyMap>
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
        values[key]
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
  private baseError = getBaseError(this.name, this.input);

  constructor(value: any, private name: string, private input: string) {
    super(value);
  }

  private checkValue(
    propType: PropertyType,
    value: any,
    // eslint-disable-next-line @typescript-eslint/ban-types
    valueType: string | Function,
    length?: (value: any) => number
  ): any {
    // TODO: Runtime values

    const isValidType =
      typeof valueType === 'string'
        ? typeof value === valueType
        : value instanceof valueType;

    const typeString =
      typeof valueType === 'string' ? valueType : valueType.name;
    if (!isValidType) {
      throw new Error(`${this.baseError} is not of type '${typeString}'`);
    }

    const unknownConstraint = propType.constraint as BaseConstraint<any>;
    if (!unknownConstraint) {
      return value;
    }
    if (unknownConstraint.isValid && !unknownConstraint.isValid(value)) {
      throw new Error(`${this.baseError} is  '${typeString}'`);
    }

    let min: number | undefined = undefined;
    let max: number | undefined = undefined;
    switch (propType.type) {
      case Type.Boolean:
        return value;
      case Type.Int: {
        const numConstraint = unknownConstraint as Constraint<number>;
        min = numConstraint.min;
        max = numConstraint.max;
        break;
      }
      case Type.Float: {
        const numConstraint = unknownConstraint as Constraint<number>;
        if (numConstraint.precision) {
          const diff = (value * (1 / numConstraint.precision)) % 1;
          if (diff > 0.01) {
            // TODO: Validate this works
            throw new Error(`${this.baseError} has invalid floating precision`);
          }
        }
        min = numConstraint.min;
        max = numConstraint.max;
        break;
      }
      case Type.String: {
        const strConstraint = unknownConstraint as Constraint<string>;
        min = strConstraint.minLength;
        max = strConstraint.maxLength;
        break;
      }
      case Type.Date: {
        const dateConstraint = unknownConstraint as Constraint<Date>;
        min = dateConstraint.minDate?.getTime();
        max = dateConstraint.maxDate?.getTime();
        break;
      }
      case Type.Array: {
        const arrConstraint = unknownConstraint as Constraint<any[]>;
        min = arrConstraint.minItems;
        max = arrConstraint.maxItems;
        break;
      }
    }

    if (min !== undefined && length && length(value) < min) {
      throw new Error(
        `${this.baseError} is smaller than a min value of ${min}`
      );
    } else if (max !== undefined && length && length(value) > max) {
      throw new Error(`${this.baseError} is larger than a max value of ${max}`);
    }

    return value;
  }

  visitBoolValue = (type: BooleanType, value: any) => {
    return this.checkValue(type, value, 'boolean');
  };
  visitIntValue = (type: IntType, value: any) => {
    if (typeof value === 'number' && Math.abs(value) % 1 !== 0) {
      throw new Error(`${this.baseError} is not an integer`);
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

  checkArrayValue = (type: ArrayType, value: any): [false] => {
    this.checkValue(type, value, Array, (arr) => arr.length);
    return [false];
  };
  mapArrayValue = (_: ArrayType, value: any[]): any => value;

  mapNullValue = () => null;
  mapUndefinedValue = () => undefined;

  checkComplexValue = (): [false] => [false];
  mapComplexValue = (_: ComplexType, value: { [key: string]: any }) => value;
}

export function validateInputValue(
  name: string,
  input: string,
  property: PropertyDefinition<any>,
  value: any
): any {
  const visitor = new ValidateInputVisitor(value, name, input);
  try {
    return acceptPropertyType(visitor, property.type);
  } catch (err) {
    return err as Error;
  }
}
