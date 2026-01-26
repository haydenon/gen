import { Type } from '@haydenon/gen-core';
import {
  NullableTypeResponse,
  PropertyTypeResponse,
  UndefinableTypeResponse,
} from '@haydenon/gen-server';
import { Edit } from 'react-feather';
import styled from 'styled-components';
import Button, { ButtonStyle } from '../../../components/Button';
import CodeText from '../../../components/CodeText';
import { ReadOnlyInput } from '../../../components/Input';
import { generateDefaultValue } from '../../../utilities/default-value.generator';
import { WELL_KNOWN_RUNTIME_VALUES, formRuntimeValueEquals, isFormRuntimeValue } from '../runtime-value';
import { BaseInputProps } from './props';
import { InputForType } from './ResourceField';

interface Props extends BaseInputProps {
  type: NullableTypeResponse | UndefinableTypeResponse;
  value: any;
  onChange: (value: any) => void;
}
const IconButton = styled(Button)`
  font-size: var(--typography-size-small);
`;

const ReadOnlyDisplay = styled(ReadOnlyInput)`
  margin-top: ${(props) =>
    props.label ? 'calc(-1 * var(--labelOffset))' : 'unset'};
`;

interface ValueProps extends BaseInputProps {
  type: PropertyTypeResponse;
  value: unknown | null | undefined;
  onChange: (value: any) => void;
}
const Value = ({ type, value, onChange, ...baseProps }: ValueProps) => {
  // Check if value is the special undefined runtime value
  const isUndefinedValue = isFormRuntimeValue(value) &&
    formRuntimeValueEquals(value, WELL_KNOWN_RUNTIME_VALUES.undefined);

  if (!isUndefinedValue && value !== null) {
    return (
      <InputForType
        {...baseProps}
        type={type}
        value={value}
        onChange={onChange}
      />
    );
  }

  return (
    <>
      <ReadOnlyDisplay label={baseProps.name ?? ''}>
        <CodeText>{value === null ? 'null' : 'undefined'}</CodeText>
      </ReadOnlyDisplay>
      <Button
        buttonStyle={ButtonStyle.Icon}
        onClick={() => onChange(generateDefaultValue(type))}
      >
        <Edit size={18} />
      </Button>
    </>
  );
};

const UndefinableNullableField = ({ parentActions, ...baseProps }: Props) => {
  const { type, onChange, value } = baseProps;
  let nullable =
    type.type === Type.Nullable || type.inner.type === Type.Nullable;
  let undefinable =
    type.type === Type.Undefinable || type.inner.type === Type.Undefinable;
  const inner =
    type.inner.type === Type.Undefinable || type.inner.type === Type.Nullable
      ? type.inner.inner
      : type.inner;

  // Check if value is the special undefined runtime value
  const isUndefinedValue = isFormRuntimeValue(value) &&
    formRuntimeValueEquals(value, WELL_KNOWN_RUNTIME_VALUES.undefined);

  return (
    <>
      <Value parentActions={null} {...baseProps} type={inner} />
      {nullable && value !== null ? (
        <IconButton
          buttonStyle={ButtonStyle.Icon}
          onClick={() => onChange(null)}
        >
          <CodeText>null</CodeText>
        </IconButton>
      ) : null}
      {undefinable && !isUndefinedValue ? (
        <IconButton
          buttonStyle={ButtonStyle.Icon}
          onClick={() => onChange(WELL_KNOWN_RUNTIME_VALUES.undefined)}
        >
          <CodeText>undef</CodeText>
        </IconButton>
      ) : null}
      {parentActions}
    </>
  );
};

export default UndefinableNullableField;
