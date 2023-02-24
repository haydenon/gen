import styled from 'styled-components';
import { BasicTypeResponse } from '@haydenon/gen-server';
import { InputType } from '../../../components/Input/Input';

import FieldInput from './FieldInput';
import { BaseInputProps } from './props';

const Wrapper = styled.div<{ offset: boolean }>`
  flex: 0 1 300px;
  margin-top: ${(props) =>
    props.offset ? 'calc(-1 * var(--labelOffset))' : 'unset'};
`;

interface Props extends BaseInputProps {
  type: BasicTypeResponse;
  value: number | undefined | null;
  onChange: (value: number | undefined | null) => void;
}

const NumberInput = ({ type, value, name, onChange, parentActions }: Props) => {
  return (
    <>
      <Wrapper offset={name !== null}>
        <FieldInput
          type={InputType.Number}
          label={name ?? ''}
          value={value ?? 0}
          onChange={onChange}
        />
      </Wrapper>
      {parentActions}
    </>
  );
};

export default NumberInput;
