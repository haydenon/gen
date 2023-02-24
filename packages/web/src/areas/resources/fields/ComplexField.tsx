import { ComplexTypeResponse } from '@haydenon/gen-server';
import styled from 'styled-components';
import { NonFormLabel } from '../../../components/Label';
import { getFieldDisplayName } from './field.utils';
import { BaseInputProps } from './props';
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
    padding-bottom: var(--spacing-small);
  }
`;

const InputsWrapper = styled.div`
  padding-left: var(--spacing-small);
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
  ...baseProps
}: Props) => {
  const handleChange = (field: string) => (fieldValue: any) => {
    const newValue = { ...value, [field]: fieldValue };
    onChange(newValue);
  };

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
                context={baseProps.context}
              />
            </InputWrapper>
          ))}
        </InputsWrapper>
      </Wrapper>
    </FieldLabel>
  );
};

export default ComplexField;
