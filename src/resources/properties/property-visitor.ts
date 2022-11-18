import {
  PropertyType,
  isComplex,
  isArray,
  isNullable,
  isUndefinable,
  isBool,
  isInt,
  isFloat,
  isDate,
  BooleanType,
  IntType,
  FloatType,
  StringType,
  DateType,
  ArrayType,
  Nullable,
  Undefinable,
  ComplexType,
} from './properties';

export function acceptPropertyType<T>(
  visitor: PropertyTypeVisitor<T>,
  type: PropertyType
): T {
  if (isComplex(type)) {
    return visitor.visitComplex(type);
  } else if (isArray(type)) {
    return visitor.visitArray(type);
  } else if (isNullable(type)) {
    return visitor.visitNull(type);
  } else if (isUndefinable(type)) {
    return visitor.visitUndefined(type);
  } else if (isBool(type)) {
    return visitor.visitBool(type);
  } else if (isInt(type)) {
    return visitor.visitInt(type);
  } else if (isFloat(type)) {
    return visitor.visitFloat(type);
  } else if (isDate(type)) {
    return visitor.visitDate(type);
  } else {
    return visitor.visitStr(type);
  }
}

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
}

export abstract class ValueAndPropertyVisitor<T>
  implements PropertyTypeVisitor<T>
{
  constructor(private value: any) {}

  visitBool = (type: BooleanType) => this.visitBoolValue(type, this.value);
  visitInt = (type: IntType) => this.visitIntValue(type, this.value);
  visitFloat = (type: FloatType) => this.visitFloatValue(type, this.value);
  visitStr = (type: StringType) => this.visitStrValue(type, this.value);
  visitDate = (type: DateType) => this.visitDateValue(type, this.value);
  visitArray = (type: ArrayType) => {
    if (this.checkArrayValue) {
      const [processed, value] = this.checkArrayValue(type, this.value);
      if (processed) {
        return value;
      }
    }
    const arr = this.value as any[];
    const innerType = type.inner;
    const result: any[] = arr.map((item, i) => {
      this.value = item;

      if (this.onEnteringArrayValue) this.onEnteringArrayValue(type, item, i);

      const value = acceptPropertyType(this, innerType);

      if (this.onExitingArrayValue) this.onExitingArrayValue(type, item, i);

      return value;
    });
    this.value = arr;
    return this.mapArrayValue(type, result);
  };
  visitNull = (type: Nullable): T =>
    this.value === null
      ? this.mapNullValue(type)
      : acceptPropertyType<T>(this, type.inner);
  visitUndefined = (type: Undefinable): T =>
    this.value === undefined
      ? this.mapUndefinedValue(type)
      : acceptPropertyType<T>(this, type.inner);
  visitComplex = (type: ComplexType): T => {
    if (this.checkComplexValue) {
      const [processed, value] = this.checkComplexValue(type, this.value);
      if (processed) {
        return value;
      }
    }
    const fields = type.fields;
    const originalValue = this.value;
    const result = Object.keys(type.fields).reduce((acc, key) => {
      this.value = originalValue ? originalValue[key] : undefined;

      if (this.onEnteringComplexValue)
        this.onEnteringComplexValue(type, fields[key], key);

      acc[key] = acceptPropertyType<T>(this, fields[key]);

      if (this.onExitingComplexValue)
        this.onExitingComplexValue(type, fields[key], key);

      return acc;
    }, {} as { [key: string]: T });
    this.value = originalValue;
    return this.mapComplexValue(type, result);
  };

  protected abstract visitBoolValue: (type: BooleanType, value: any) => T;
  protected abstract visitIntValue: (type: IntType, value: any) => T;
  protected abstract visitFloatValue: (type: FloatType, value: any) => T;
  protected abstract visitStrValue: (type: StringType, value: any) => T;
  protected abstract visitDateValue: (type: DateType, value: any) => T;
  protected abstract mapNullValue: (type: Nullable) => T;
  protected abstract mapUndefinedValue: (type: Undefinable) => T;

  protected abstract checkArrayValue?: (
    type: ArrayType,
    value: any
  ) => [true, T] | [false];
  protected abstract onEnteringArrayValue?: (
    type: ArrayType,
    value: any,
    index: number
  ) => void;
  protected abstract onExitingArrayValue?: (
    type: ArrayType,
    value: any,
    index: number
  ) => void;
  protected abstract mapArrayValue: (type: ArrayType, value: T[]) => T;

  protected abstract checkComplexValue?: (
    type: ComplexType,
    value: any
  ) => [true, T] | [false];
  protected abstract onEnteringComplexValue?: (
    type: ComplexType,
    value: any,
    field: string
  ) => void;
  protected abstract onExitingComplexValue?: (
    type: ComplexType,
    value: any,
    field: string
  ) => void;
  protected abstract mapComplexValue: (
    type: ComplexType,
    value: { [key: string]: T }
  ) => T;
}
