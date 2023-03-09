import { X } from 'react-feather';
import styled, { css } from 'styled-components';
import Label from '../Label';

export enum InputState {
  Normal = 'Normal',
  Error = 'Error',
}

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

const NormalInput = styled.input`
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

const StateWrapper = styled.div<{
  color: string;
  shadow: string;
  padding: string;
}>`
  --input-state-color: var(${(props) => props.color});
  --shadow: ${(props) => props.shadow};
  --padding: ${(props) => props.padding};
  width: 100%; // Take up size of label
  position: relative;
`;

const Icon = styled.span`
  position: absolute;
  right: var(--spacing-tiny);
  top: 12px;
  color: var(--input-state-color);
`;

const StatefulInput = styled(NormalInput)`
  box-shadow: var(--shadow);
  padding-right: var(--padding);
`;

interface InputProps {
  type?: React.HTMLInputTypeAttribute | undefined;
  placeholder?: string | undefined;
  value?: string | number | readonly string[] | undefined;
  onChange?: React.ChangeEventHandler<HTMLInputElement> | undefined;
  inputState: InputState;
  message?: string;
}

const getStateColor = (inputState: InputState) => {
  switch (inputState) {
    case InputState.Error:
      return '--colors-text-danger';
    default:
      return '';
  }
};

const ContextMessage = styled.div`
  padding-top: 4px;
  color: var(--input-state-color);
  font-size: var(--typography-size-small);
  line-height: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  position: absolute;
  left: 0;
  right: 0;
`;

const CustomInput = ({ inputState, message, ...baseProps }: InputProps) => {
  const color = getStateColor(inputState);
  const shadow =
    inputState === InputState.Normal
      ? 'unset'
      : 'inset 0px 0px 2px 1px var(--input-state-color)';
  const padding =
    inputState === InputState.Normal
      ? 'var(--spacing-small)'
      : 'var(--spacing-large)';
  return (
    <StateWrapper color={color} shadow={shadow} padding={padding}>
      <StatefulInput {...baseProps} />
      {inputState !== InputState.Normal ? (
        <Icon>
          <X size={18} strokeWidth={3} />
        </Icon>
      ) : null}
      <ContextMessage>{message}</ContextMessage>
    </StateWrapper>
  );
};

export enum InputType {
  String = 'String',
  Number = 'Number',
  DateTime = 'DateTime',
}

interface BaseProps {
  type?: InputType;
  label: string;
  className?: string;
  state?: InputState;
  message?: string;
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
  state,
  message,
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
        inputState={state ?? InputState.Normal}
        type={getInputType(type)}
        placeholder={placeholder?.toString()}
        value={displayValue}
        onChange={handleChange}
        message={message}
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
