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
  height: var(--content-height);
`;

const CustomInput = styled.input`
  ${baseInputStyles}

  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;

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
  DateTime = 'DateTime',
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

interface DateTimeProps extends BaseProps {
  type: InputType.DateTime;
  placeholder?: Date;
  value?: Date;
  onChange: (value: Date) => void;
}

type Props = StringProps | NumberProps | DateTimeProps;

const getInputType = (type?: InputType) => {
  if (!type) {
    return 'text';
  }

  switch (type) {
    case InputType.DateTime:
      return 'datetime-local';
    case InputType.Number:
      return 'number';
    case InputType.String:
      return 'text';
  }
};

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
      onChange(parseFloat(newValue));
    } else if (type === InputType.DateTime) {
      onChange(new Date(newValue));
    } else {
      onChange(newValue);
    }
  };

  let displayValue: number | string | undefined;
  if (type === InputType.DateTime) {
    if (value) {
      const timeZoneDiff = value.getTimezoneOffset() * 60 * 1000;
      const localMillis = value.getTime() - timeZoneDiff;
      const local = new Date(localMillis);
      displayValue = local.toISOString();
      displayValue = displayValue.substring(0, displayValue.length - 1);
    } else {
      displayValue = undefined;
    }
  } else {
    displayValue = value;
  }

  return (
    <Label className={className} label={label}>
      <CustomInput
        type={getInputType(type)}
        placeholder={placeholder?.toString()}
        value={displayValue}
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
