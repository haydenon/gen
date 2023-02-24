import { BasicTypeResponse } from '@haydenon/gen-server';
import styled from 'styled-components';
import Label from '../../../components/Label';
import { OffsetWrapper } from './FieldInput';

import { BaseInputProps } from './props';

interface Props extends BaseInputProps {
  type: BasicTypeResponse;
  value: boolean | undefined | null;
  onChange: (value: boolean | undefined | null) => void;
}

const Checkbox = styled.input`
  --inputSize: calc(
    1rem * var(--typography-lineHeight) + (var(--spacing-tiny) * 2)
  );
  --size: var(--spacing-base);
  --margin: calc((var(--inputSize) - var(--size)) / 2);
  transition: background 0.3s;
  background: var(--colors-checkbox);
  color: var(--colors-checkbox);
  margin: var(--margin);
  width: var(--size);
  height: var(--size);
  border-radius: var(--borders-radius);
  cursor: pointer;
  border: 1px solid var(--colors-contentBackground-light-focusable);
  appearance: none;
  -webkit-appearance: none;

  font-size: var(--typography-size-small);
  font-weight: bold;

  position: relative;

  &:focus,
  &:focus-visible {
    outline: 1px auto -webkit-focus-ring-color;
  }
  &:hover {
    background: var(--colors-checkbox-focusable);
  }
  &:active {
    background: var(--colors-checkbox-focused);
  }

  &:disabled {
    cursor: not-allowed;
    background: var(--colors-checkbox-disabled);
  }

  &:checked {
    background: var(--colors-contentBackground-checkbox);
    &:hover {
      background: var(--colors-contentBackground-checkbox-focusable);
    }
    &:active {
      background: var(--colors-contentBackground-checkbox-focused);
    }
    &:disabled {
      cursor: not-allowed;
      background: var(--colors-contentBackground-checkbox-disabled);
    }
  }
  &:checked::after {
    content: '✓️';
    position: absolute;
    top: 1px;
    left: 7px;
  }
`;

const BooleanInput = ({
  type,
  value,
  name,
  onChange,
  parentActions,
}: Props) => {
  const handleChange: React.ChangeEventHandler<HTMLInputElement> = () => {
    onChange(!value);
  };
  return (
    <>
      <OffsetWrapper offset={name !== null}>
        <Label label={name || ''}>
          <Checkbox type="checkbox" checked={!!value} onChange={handleChange} />
        </Label>
      </OffsetWrapper>
      {parentActions}
    </>
  );
};

export default BooleanInput;
