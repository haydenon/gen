import styled, { css } from 'styled-components';
import Label from '../Label';

export const baseInputStyles = css`
  width: 100%; // Take up size of label
  font-size: 1rem;
  line-height: var(--typography-lineHeight);
  padding: var(--spacing-tiny) var(--spacing-small);
  border: none;
  border-radius: var(--borders-radius);
  background-color: var(--colors-contentBackground-light);
  color: var(--colors-text);
  transition: color var(--transition-duration-font);
`;

const CustomInput = styled.input`
  ${baseInputStyles}

  &:focus,
  &:focus-visible {
    outline: 2px solid #4374cb;
    outline: 5px auto -webkit-focus-ring-color;
    background-color: var(--colors-contentBackground-light-focused);
  }
  &:hover {
    background-color: var(--colors-contentBackground-light-focusable);
  }
  &:disabled {
    background-color: var(--colors-contentBackground-light-disabled);
    cursor: not-allowed;
  }
`;

export enum InputType {
  String = 'String',
  Number = 'Number',
}

interface BaseProps {
  type?: InputType;
  label: string;
  className?: string;
}

interface StringProps extends BaseProps {
  type?: InputType.String;
  placeholder?: string;
  value?: string;
  onChange: (value: string) => void;
}

interface NumberProps extends BaseProps {
  type: InputType.Number;
  placeholder?: number;
  value?: number;
  onChange: (value: number) => void;
}

type Props = StringProps | NumberProps;

const Input = ({
  className,
  placeholder,
  label,
  value,
  onChange,
  type,
}: Props) => {
  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const newValue = event.target.value;
    if (type === InputType.Number) {
      // TODO: Better number handling
      onChange(parseInt(newValue));
    } else {
      onChange(newValue);
    }
  };
  return (
    <Label className={className} label={label}>
      <CustomInput
        placeholder={placeholder?.toString()}
        value={value}
        onChange={handleChange}
      />
    </Label>
  );
};

const ReadOnlyInputBox = styled.div`
  ${baseInputStyles}
  display: flex;
  align-items: center;
  gap: var(--spacing-tiny);
`;

interface ReadOnlyProps {
  children: React.ReactNode | React.ReactNode[];
  label: string;
  className?: string;
}

export const ReadOnlyInput = ({
  className,
  label,
  children,
}: ReadOnlyProps) => {
  return (
    <Label className={className} label={label}>
      <ReadOnlyInputBox>{children}</ReadOnlyInputBox>
    </Label>
  );
};

export default Input;
