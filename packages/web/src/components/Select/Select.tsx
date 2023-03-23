import React, {
  ChangeEvent,
  ReactElement,
  useCallback,
  useMemo,
  useState,
} from 'react';

import styled from 'styled-components';

import Label from '../Label';
import {
  Combobox,
  ComboboxItem,
  ComboboxPopover,
  useComboboxState,
} from 'ariakit';
import { baseInputStyles } from '../Input/Input';
import { menuItemStyles, menuStyles } from '../Menu/Menu';

interface Option {
  label: string;
  value: string;
}

interface SelectProps {
  label: string;
  options: Option[] | string[];
  value?: string;
  onChange: (value: string) => void;
  optionRender?: (display: string) => React.ReactNode;
}

export function getDisplayedValue(
  value: string | undefined,
  children: React.ReactNode | React.ReactNode[]
) {
  if (value === undefined) {
    return '(not selected)';
  }

  const childArray = React.Children.toArray(children);
  const selectedChild = childArray.find(
    (child) => (child as ReactElement<any>).props.value === value
  );

  if (!selectedChild) {
    return '(not selected)';
  }

  return (selectedChild as ReactElement<any>).props.children;
}

const ComboboxInput = styled(Combobox)`
  ${baseInputStyles}

  &:focus,
  &:focus-visible {
    outline: 2px solid #4374cb;
    outline: 5px auto -webkit-focus-ring-color;
    background-color: var(--colors-contentBackground-light-focused);
  }

  margin-bottom: var(--spacing-tiny);
`;

const ComboboxList = styled(ComboboxPopover)`
  ${menuStyles}
`;

const ComboboxValue = styled(ComboboxItem)`
  ${menuItemStyles}

  min-width: 200px;
`;

const NoItems = styled.div`
  padding: var(--spacing-tiny) var(--spacing-small);
`;

const Select = ({
  label,
  value,
  onChange,
  options,
  optionRender,
}: SelectProps) => {
  const opts: Option[] = useMemo(
    () =>
      options.length === 0
        ? (options as Option[])
        : typeof options[0] === 'string'
        ? (options as string[]).map((value) => ({ value, label: value }))
        : (options as Option[]),
    [options]
  );
  const values: string[] = useMemo(() => opts.map((opt) => opt.value), [opts]);

  const [hasEdited, setHasEdited] = useState<boolean>();

  const displayByOption = useMemo(
    () =>
      opts.reduce(
        (acc, { label, value }) => ({
          ...acc,
          [value]: label,
        }),
        {} as { [value: string]: string }
      ),
    [opts]
  );

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement> | string) => {
      let setValue: string;
      if (typeof event === 'string') {
        setValue = event;
      } else {
        setHasEdited(true);
        setValue = event.target.value;
      }

      if (values.includes(setValue)) {
        onChange(setValue);
      }
    },
    [onChange, values, setHasEdited]
  );

  const combobox = useComboboxState({
    list: values,
    setValue: handleChange,
    defaultValue: value,
    gutter: 8,
  });

  const handleInteraction = useCallback(() => {
    setHasEdited(false);
  }, [setHasEdited]);

  return (
    <>
      <Label label={label}>
        <ComboboxInput
          state={combobox}
          onChange={handleChange}
          onFocus={handleInteraction}
          onBlur={handleInteraction}
        />
      </Label>
      <ComboboxList state={combobox}>
        {hasEdited ? (
          combobox.matches.length ? (
            combobox.matches.map((opt) => (
              <ComboboxValue key={opt} value={opt}>
                {optionRender
                  ? optionRender(displayByOption[opt])
                  : displayByOption[opt]}
              </ComboboxValue>
            ))
          ) : (
            <NoItems>No items</NoItems>
          )
        ) : (
          values.map((opt) => (
            <ComboboxValue key={opt} value={opt}>
              {optionRender
                ? optionRender(displayByOption[opt])
                : displayByOption[opt]}
            </ComboboxValue>
          ))
        )}
      </ComboboxList>
    </>
  );
};

export default Select;
