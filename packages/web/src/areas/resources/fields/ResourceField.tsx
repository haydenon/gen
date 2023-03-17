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
import LinkInput from './LinkInput';
import BooleanInput from './BooleanInput';
import UndefinableNullableField from './UndefinableNullableField';
import ComplexField from './ComplexField';
import DateInput from './DateInput';
import { DesiredStateFormError } from '../desired-resources/desired-resource';
import { useMemo } from 'react';

interface TypeProps extends BaseInputProps {
  type: PropertyTypeResponse;
  value: any;
  onChange: (value: any) => void;
  parentActions: React.ReactNode | React.ReactNode[];
  errors: DesiredStateFormError[];
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
    case Type.Boolean:
      return (
        <BooleanInput
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
          value={value}
          type={type}
          onChange={onChange}
        />
      );
    case Type.Link:
      return (
        <LinkInput
          type={type}
          {...baseProps}
          value={value}
          onChange={onChange}
        />
      );

    case Type.Undefinable:
    case Type.Nullable:
      return (
        <UndefinableNullableField
          {...baseProps}
          type={type}
          value={value}
          onChange={onChange}
        />
      );
    case Type.Complex:
      return (
        <ComplexField
          {...baseProps}
          type={type}
          value={value}
          onChange={onChange}
        />
      );
    case Type.Date:
      return (
        <DateInput
          {...baseProps}
          type={type}
          value={value}
          onChange={onChange}
        />
      );
    default:
      return <>Field</>;
  }
};

interface RootProps {
  desiredResourceId: string;
  fieldDefinition: PropertyDefinitionResponse;
  value: any;
  onRemoveField: () => void;
  onChange: (value: any) => void;
  errors: DesiredStateFormError[];
}

const FieldActions = styled.div`
  flex: 0 1 auto;
  display: flex;
`;

const InputRoot = styled(InputForType)`
  --indent-size: var(--spacing-base);
`;

const ResourceField = ({
  fieldDefinition,
  value,
  onRemoveField,
  onChange,
  desiredResourceId,
  errors,
}: RootProps) => {
  const displayName = useMemo(
    () => getFieldDisplayName(fieldDefinition.name),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  const context = useMemo(
    () => ({
      rootInputName: fieldDefinition.name,
      desiredResourceId,
      currentPath: [fieldDefinition.name],
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  return (
    <InputRoot
      type={fieldDefinition.type}
      name={displayName}
      value={value}
      onChange={onChange}
      context={context}
      errors={errors}
      parentActions={
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
      }
    />
  );
};

export default ResourceField;
