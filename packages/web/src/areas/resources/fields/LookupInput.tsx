import CodeText from '../../../components/CodeText';
import Select from '../../../components/Select';
import { OffsetWrapper } from './FieldInput';

import { BaseInputProps } from './props';

interface Props extends BaseInputProps {
  validValues: any[];
  value: any;
  onChange: (value: string) => void;
}

const LookupInput = ({ validValues, onChange, value }: Props) => {
  return (
    <OffsetWrapper offset={true}>
      <Select
        label="Test"
        value={value.toString()}
        options={validValues}
        onChange={onChange}
        optionRender={(opt) => <CodeText>{opt}</CodeText>}
      ></Select>
    </OffsetWrapper>
  );
};

export default LookupInput;
