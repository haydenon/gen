import { ComplexTypeResponse } from '@haydenon/gen-server';
import { useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { NonFormLabel } from '../../../components/Label';
import { DesiredStateFormError } from '../desired-resources/desired-resource';
import { getFieldDisplayName } from './field.utils';
import { BaseInputProps, InputContext } from './props';
import { InputForType } from './ResourceField';

interface Props extends BaseInputProps {
  type: ComplexTypeResponse;
  value: { [field: string]: any };
  onChange: (value: { [field: string]: any }) => void;
}

const FieldLabel = styled(NonFormLabel)`
  margin-top: ${(props) =>
    props.label ? 'calc(-1 * var(--labelOffset))' : 'unset'};
`;

const InputWrapper = styled.div`
  padding-top: var(--labelOffset);
  display: flex;
  gap: var(--spacing-tiny);
  &:not(:last-child) {
    padding-bottom: var(--spacing-base);
  }
`;

const InputsWrapper = styled.div`
  padding-left: var(--spacing-base);
  border-left: 4px solid var(--colors-contentBackground-light-disabled);
  margin: var(--spacing-tiny) 0;
`;

const Wrapper = styled.div``;

const ComplexField = ({
  name,
  type,
  parentActions,
  value,
  onChange,
  context,
  errors,
}: Props) => {
  const fields = useMemo(() => type.fields, [type]);
  const handleChange = useCallback(
    (field: string) => (fieldValue: any) => {
      const newValue = { ...value, [field]: fieldValue };
      onChange(newValue);
    },
    [onChange, value]
  );
  const contextByField = useMemo(
    () =>
      Object.keys(fields).reduce(
        (acc, field) => ({
          ...acc,
          [field]: {
            ...context,
            currentPath: [...context.currentPath, field],
          },
        }),
        {} as { [field: string]: InputContext }
      ),
    [context, fields]
  );
  const errorsByField = useMemo(
    () =>
      Object.keys(fields).reduce(
        (acc, field) => ({
          ...acc,
          [field]: errors.filter((err) => {
            const path = contextByField[field].currentPath;
            return path.every((p, idx) => err.path[idx] === p);
          }),
        }),
        {} as { [field: string]: DesiredStateFormError[] }
      ),
    [errors, contextByField, fields]
  );

  return (
    <FieldLabel label={name || ''}>
      <Wrapper>
        {parentActions}
        <InputsWrapper>
          {Object.keys(type.fields).map((field) => (
            <InputWrapper key={field}>
              <InputForType
                name={getFieldDisplayName(field)}
                type={type.fields[field]}
                parentActions={null}
                value={value[field]}
                onChange={handleChange(field)}
                context={contextByField[field]}
                errors={errorsByField[field]}
              />
            </InputWrapper>
          ))}
        </InputsWrapper>
      </Wrapper>
    </FieldLabel>
  );
};

export default ComplexField;
