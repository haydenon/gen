import { BasicTypeResponse } from '@haydenon/gen-server';
import styled from 'styled-components';

import FieldInput, { OffsetWrapper } from './FieldInput';
import { BaseInputProps } from './props';

interface Props extends BaseInputProps {
  type: BasicTypeResponse;
  value: string | undefined | null;
  onChange: (value: string | undefined | null) => void;
}

const Wrapper = styled(OffsetWrapper)`
  flex: 0 1 800px;
`;

const StringInput = ({ type, value, name, onChange, parentActions }: Props) => {
  return (
    <>
      <Wrapper offset={name !== null}>
        <FieldInput
          label={name ?? ''}
          value={value ?? ''}
          onChange={onChange}
        />
      </Wrapper>
      {parentActions}
    </>
  );
};

export default StringInput;
