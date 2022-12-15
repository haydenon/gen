import { BasicTypeResponse } from '@haydenon/gen-server';

import FieldInput from './FieldInput';
import { BaseInputProps } from './props';

interface Props extends BaseInputProps {
  type: BasicTypeResponse;
  value: string | undefined | null;
  onChange: (value: string | undefined | null) => void;
}

const StringInput = ({ type, value, name, onChange }: Props) => {
  return <FieldInput label={name} value={value ?? ''} onChange={onChange} />;
};

export default StringInput;
