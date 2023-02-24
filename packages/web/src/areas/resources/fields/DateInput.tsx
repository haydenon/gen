import {
  Call,
  evaluate,
  identifier,
  Literal,
  Variable,
} from '@haydenon/gen-core';
import { BasicTypeResponse } from '@haydenon/gen-server';
import { useMemo } from 'react';
import styled from 'styled-components';
import { InputType } from '../../../components/Input/Input';
import { FormRuntimeValue } from '../runtime-value';
import FieldInput, { OffsetWrapper } from './FieldInput';
import { BaseInputProps } from './props';

const Wrapper = styled(OffsetWrapper)`
  flex: 0 1 300px;
`;

interface Props extends BaseInputProps {
  type: BasicTypeResponse;
  value: FormRuntimeValue;
  onChange: (value: FormRuntimeValue) => void;
}

const DateInput = ({ type, value, name, onChange, parentActions }: Props) => {
  const dateValue = useMemo(
    () => evaluate(value.expression, {}) as Date,
    [value]
  );

  return (
    <>
      <Wrapper offset={name !== null}>
        <FieldInput
          type={InputType.DateTime}
          label={name ?? ''}
          value={dateValue}
          onChange={(date) => {
            const year = date.getUTCFullYear();
            const month = date.getUTCMonth() + 1;
            const day = date.getUTCDate();
            const hour = date.getUTCHours();
            const minutes = date.getUTCMinutes();
            const seconds = date.getUTCSeconds();
            const args = [year, month, day, hour, minutes, seconds];
            onChange(
              new FormRuntimeValue(
                undefined,
                new Call(
                  new Variable(identifier('date')),
                  args.map((a) => new Literal(a))
                )
              )
            );
          }}
        />
      </Wrapper>
      {parentActions}
    </>
  );
};

export default DateInput;
