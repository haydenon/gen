import { BasicTypeResponse } from '@haydenon/gen-server';
import styled from 'styled-components';

import FieldInput from './FieldInput';
import { BaseInputProps } from './props';

interface Props extends BaseInputProps {
  type: BasicTypeResponse;
  value: string | undefined | null;
  onChange: (value: string | undefined | null) => void;
}

const Wrapper = styled.div<{ offset: boolean }>`
  flex: 0 1 800px;
  margin-top: ${(props) =>
    props.offset ? 'calc(-1 * var(--labelOffset))' : 'unset'};
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
