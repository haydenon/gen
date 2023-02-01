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

const getDisplayName = (response: PropertyDefinitionResponse) => {
  const name = response.name;
  const res = name.replace(/([A-Z]+)/g, ' $1').replace(/([A-Z][a-z])/g, ' $1');
  return res[0].toLocaleUpperCase() + res.substring(1);
};

interface TypeProps extends BaseInputProps {
  type: PropertyTypeResponse;
  value: any;
}

export const InputForType = ({ type, value, ...baseProps }: TypeProps) => {
  switch (type.type) {
    case Type.Int:
    case Type.Float:
      return (
        <NumberInput
          {...baseProps}
          type={type}
          value={value}
          onChange={console.log}
        />
      );
    case Type.String:
      return (
        <StringInput
          {...baseProps}
          type={type}
          value={value}
          onChange={console.log}
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
      return <InputForType type={type.inner} {...baseProps} value={value} />;
    case Type.Undefinable:
      return (
        <InputForType
          {...baseProps}
          type={type.inner}
          undefinable={true}
          value={value}
        />
      );
    case Type.Nullable:
      return (
        <InputForType
          {...baseProps}
          type={type.inner}
          nullable={true}
          value={value}
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
}: RootProps) => {
  const displayName = getDisplayName(fieldDefinition);
  return (
    <>
      <InputForType
        type={fieldDefinition.type}
        name={displayName}
        undefinable={false}
        nullable={false}
        value={value}
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
