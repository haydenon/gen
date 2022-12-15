import styled from 'styled-components';
import { BasicTypeResponse } from '@haydenon/gen-server';
import { InputType } from '../../../components/Input/Input';

import FieldInput from './FieldInput';
import { BaseInputProps } from './props';

const NumInput = styled(FieldInput)`
  width: clamp(200px, 80%, 300px);
`;

interface Props extends BaseInputProps {
  type: BasicTypeResponse;
  value: number | undefined | null;
  onChange: (value: number | undefined | null) => void;
}

const NumberInput = ({ type, value, name, onChange }: Props) => {
  return (
    <NumInput
      type={InputType.Number}
      label={name}
      value={value ?? 0}
      onChange={onChange}
    />
  );
};

export default NumberInput;
