import styled from 'styled-components';

const CustomInput = styled.input`
  font-size: 1rem;
  padding: var(--spacing-tiny) var(--spacing-small);
  border: none;
  border-radius: var(--borders-radius);
  background-color: var(--colors-contentBackground-light);
  color: var(--colors-text);
  transition: color var(--transition-duration-font);

  &:focus {
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

interface Props {
  placeholder?: string;
  value?: string;
  onChange: (value: string) => void;
}

const Input = ({ placeholder, value, onChange }: Props) => {
  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const newValue = event.target.value;
    onChange(newValue);
  };
  return (
    <CustomInput
      placeholder={placeholder}
      value={value}
      onChange={handleChange}
    />
  );
};

export default Input;
