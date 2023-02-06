import { BasicTypeResponse } from '@haydenon/gen-server';
import styled from 'styled-components';

import FieldInput from './FieldInput';
import { BaseInputProps } from './props';

interface Props extends BaseInputProps {
  type: BasicTypeResponse;
  value: string | undefined | null;
  onChange: (value: string | undefined | null) => void;
}

const Wrapper = styled.div`
  flex: 0 1 800px;
  margin-top: calc(-1 * var(--labelOffset));
`;

const StringInput = ({ type, value, name, onChange }: Props) => {
  return (
    <Wrapper>
      <FieldInput label={name} value={value ?? ''} onChange={onChange} />
    </Wrapper>
  );
};

export default StringInput;
