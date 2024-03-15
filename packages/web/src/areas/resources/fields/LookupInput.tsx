import { useCallback, useMemo } from 'react';
import CodeText from '../../../components/CodeText';
import Select from '../../../components/Select';
import { OffsetWrapper } from './FieldInput';

import { BaseInputProps } from './props';

interface Props extends BaseInputProps {
  validValues: any[];
  value: any;
  onChange: (value: string) => void;
}

const LookupInput = ({
  validValues,
  onChange,
  value,
  parentActions,
  name,
}: Props) => {
  const values = useMemo(
    () =>
      validValues.length === 0 || typeof validValues[0] === 'string'
        ? validValues
        : validValues.map((v) => v.toString()),
    [validValues]
  );

  const handleChange = useCallback(
    (value: string) => {
      if (validValues === values) {
        return onChange(value);
      }

      const index = values.indexOf(value);
      onChange(validValues[index]);
    },
    [onChange, validValues, values]
  );
  return (
    <>
      <OffsetWrapper offset={name !== null}>
        <Select
          label={name ?? ''}
          value={value.toString()}
          options={values}
          onChange={handleChange}
        ></Select>
      </OffsetWrapper>
      {parentActions}
    </>
  );
};

export default LookupInput;
