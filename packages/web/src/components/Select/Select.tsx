import styled from 'styled-components';

import { ChevronDown } from 'react-feather';

const Wrapper = styled.div`
  position: relative;
  width: max-content;
`;

const NativeSelect = styled.select`
  position: absolute;
  appearance: none;
  -webkit-appearance: none;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  border: none;
  outline: none;
`;

const CustomSelect = styled.div`
  width: max-content;
  background-color: var(--colors-contentBackground-light);
  border-radius: var(--borders-radius);
  padding: 12px 16px;
  padding-right: 52px;
  color: var(--colors-text);
  font-size: ${16 / 16}rem;
  ${NativeSelect}:focus + & {
    outline: 2px solid #4374cb;
    outline: 5px auto -webkit-focus-ring-color;
    background-color: var(--colors-contentBackground-light-focused);
  }
  ${NativeSelect}:hover + & {
    background-color: var(--colors-contentBackground-light-focusable);
  }
`;

const IconWrapper = styled.div`
  --size: 16px;
  position: absolute;
  top: 0;
  bottom: 0;
  right: 10px;
  margin: auto;
  width: var(--size);
  height: var(--size);
  pointer-events: none;
`;

interface SelectProps {
  label: string;
  children?: React.ReactChild | React.ReactChild[];
  value: string;
  onChange?: () => void;
}

const Select = ({ label, value, onChange, children }: SelectProps) => {
  return (
    <Wrapper>
      <NativeSelect value={value} onChange={onChange}>
        {children}
      </NativeSelect>
      <CustomSelect>
        {'test'}
        <IconWrapper>
          <ChevronDown size={16} strokeWidth={3} />
        </IconWrapper>
      </CustomSelect>
    </Wrapper>
  );
};

export default Select;
