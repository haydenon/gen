import { identifier, Type, Variable } from '@haydenon/gen-core';
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
import { FormRuntimeValue } from '../runtime-value';
import { BaseInputProps } from './props';
import { InputForType } from './ResourceField';

interface Props extends BaseInputProps {
  type: NullableTypeResponse | UndefinableTypeResponse;
  value: any;
  onChange: (value: any) => void;
}

const undefinedValue = new FormRuntimeValue(
  undefined,
  new Variable(identifier('undefined'))
);

const IconButton = styled(Button)`
  font-size: var(--typography-size-small);
`;

const ReadOnlyDisplay = styled(ReadOnlyInput)`
  margin-top: calc(-1 * var(--labelOffset));
`;

interface ValueProps extends BaseInputProps {
  type: PropertyTypeResponse;
  value: unknown | null | undefined;
  onChange: (value: any) => void;
}
const Value = ({ type, value, onChange, ...baseProps }: ValueProps) => {
  if (value !== undefinedValue && value !== null) {
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
      <ReadOnlyDisplay label={baseProps.name}>
        <CodeText>{value === null ? 'null' : 'undefined'}</CodeText>
      </ReadOnlyDisplay>
      <Button buttonStyle={ButtonStyle.Icon} onClick={() => onChange(0)}>
        {/* TODO: Better defaults */}
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
      {undefinable && value !== undefinedValue ? (
        <IconButton
          buttonStyle={ButtonStyle.Icon}
          onClick={() => onChange(undefinedValue)}
        >
          <CodeText>undef</CodeText>
        </IconButton>
      ) : null}
      {parentActions}
    </>
  );
};

export default UndefinableNullableField;
