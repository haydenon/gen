import { Type } from '@haydenon/gen-core';
import { Minus } from 'react-feather';
import {
  PropertyDefinitionResponse,
  PropertyTypeResponse,
} from '@haydenon/gen-server';
import Button, { ButtonColour, ButtonStyle } from '../../../components/Button';
import VisuallyHidden from '../../../components/VisuallyHidden';
import ArrayInput from './ArrayInput';

import NumberInput from './NumberInput';
import { BaseInputProps } from './props';
import StringInput from './StringInput';
import styled from 'styled-components';
import { getFieldDisplayName } from './field.utils';

interface TypeProps extends BaseInputProps {
  type: PropertyTypeResponse;
  value: any;
  onChange: (value: any) => void;
}

export const InputForType = ({
  type,
  value,
  onChange,
  ...baseProps
}: TypeProps) => {
  switch (type.type) {
    case Type.Int:
    case Type.Float:
      return (
        <NumberInput
          {...baseProps}
          type={type}
          value={value}
          onChange={onChange}
        />
      );
    case Type.String:
      return (
        <StringInput
          {...baseProps}
          type={type}
          value={value}
          onChange={onChange}
        />
      );
    case Type.Array:
      return (
        <ArrayInput
          {...baseProps}
          value={undefined}
          type={type}
          onChange={console.log}
        />
      );
    case Type.Link:
      return (
        <InputForType
          type={type.inner}
          {...baseProps}
          value={value}
          onChange={onChange}
        />
      );
    case Type.Undefinable:
      return (
        <InputForType
          {...baseProps}
          type={type.inner}
          undefinable={true}
          value={value}
          onChange={onChange}
        />
      );
    case Type.Nullable:
      return (
        <InputForType
          {...baseProps}
          type={type.inner}
          nullable={true}
          value={value}
          onChange={onChange}
        />
      );
    default:
      return <>Field</>;
  }
};

interface RootProps {
  fieldDefinition: PropertyDefinitionResponse;
  value: any;
  onRemoveField: () => void;
  onChange: (value: any) => void;
}

const FieldActions = styled.div`
  flex: 0 1 auto;
  display: flex;
  align-items: flex-end;
`;

const ResourceField = ({
  fieldDefinition,
  value,
  onRemoveField,
  onChange,
}: RootProps) => {
  const displayName = getFieldDisplayName(fieldDefinition.name);
  return (
    <>
      <InputForType
        type={fieldDefinition.type}
        name={displayName}
        undefinable={false}
        nullable={false}
        value={value}
        onChange={onChange}
      />
      <FieldActions>
        <Button
          buttonStyle={ButtonStyle.Icon}
          colour={ButtonColour.Warn}
          onClick={onRemoveField}
        >
          <VisuallyHidden>Remove specifed field</VisuallyHidden>
          <Minus size={16} strokeWidth={3} />
        </Button>
      </FieldActions>
    </>
  );
};

export default ResourceField;
