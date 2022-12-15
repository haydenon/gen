import styled from 'styled-components';
import Label from '../Label';

const CustomInput = styled.input`
  font-size: 1rem;
  padding: var(--spacing-tiny) var(--spacing-small);
  border: none;
  border-radius: var(--borders-radius);
  background-color: var(--colors-contentBackground-light);
  color: var(--colors-text);
  transition: color var(--transition-duration-font);

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
    <Label label={label}>
      <CustomInput
        className={className}
        placeholder={placeholder?.toString()}
        value={value}
        onChange={handleChange}
      />
    </Label>
  );
};

export default Input;
