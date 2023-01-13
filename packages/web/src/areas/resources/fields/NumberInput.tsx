import styled from 'styled-components';
import { BasicTypeResponse } from '@haydenon/gen-server';
import { InputType } from '../../../components/Input/Input';

import FieldInput from './FieldInput';
import { BaseInputProps } from './props';

const Wrapper = styled.div`
  flex: 0 1 300px;
`;

interface Props extends BaseInputProps {
  type: BasicTypeResponse;
  value: number | undefined | null;
  onChange: (value: number | undefined | null) => void;
}

const NumberInput = ({ type, value, name, onChange }: Props) => {
  return (
    <Wrapper>
      <FieldInput
        type={InputType.Number}
        label={name}
        value={value ?? 0}
        onChange={onChange}
      />
    </Wrapper>
  );
};

export default NumberInput;
