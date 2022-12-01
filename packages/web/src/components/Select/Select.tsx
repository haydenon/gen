import React, { ReactElement } from 'react';

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

  &:disabled {
    cursor: not-allowed;
  }
`;

const CustomSelect = styled.div`
  width: max-content;
  background-color: var(--colors-contentBackground-light);
  border-radius: var(--borders-radius);
  padding: var(--spacing-tiny) var(--spacing-small);
  padding-right: 52px;
  color: var(--colors-text);
  transition: color var(--transition-duration-font);
  font-size: ${16 / 16}rem;
  ${NativeSelect}:focus + & {
    outline: 2px solid #4374cb;
    outline: 5px auto -webkit-focus-ring-color;
    background-color: var(--colors-contentBackground-light-focused);
  }
  ${NativeSelect}:hover + & {
    background-color: var(--colors-contentBackground-light-focusable);
  }
  ${NativeSelect}:disabled + & {
    background-color: var(--colors-contentBackground-light-disabled);
    cursor: not-allowed;
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
  children?: React.ReactNode | React.ReactNode[];
  value: string;
  onChange: (value: string) => void;
}

export function getDisplayedValue(
  value: string,
  children: React.ReactNode | React.ReactNode[]
) {
  const childArray = React.Children.toArray(children);
  const selectedChild = childArray.find(
    (child) => (child as ReactElement<any>).props.value === value
  );

  if (!selectedChild) {
    return '(not selected)';
  }

  return (selectedChild as ReactElement<any>).props.children;
}

const Select = ({ label, value, onChange, children }: SelectProps) => {
  const handleChange: React.ChangeEventHandler<HTMLSelectElement> = (event) => {
    onChange(event.target.value);
  };
  return (
    <Wrapper>
      <NativeSelect value={value} onChange={handleChange}>
        {children}
      </NativeSelect>
      <CustomSelect>
        {getDisplayedValue(value, children)}
        <IconWrapper>
          <ChevronDown size={16} strokeWidth={3} />
        </IconWrapper>
      </CustomSelect>
    </Wrapper>
  );
};

export default Select;
