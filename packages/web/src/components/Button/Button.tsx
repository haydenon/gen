import styled, { css } from 'styled-components';

export enum ButtonStyle {
  Transparent,
  Light,
  Icon,
}

interface Props {
  className?: string;
  style?: ButtonStyle;
  children: React.ReactNode | React.ReactNode[];
  disabled?: boolean;
  onClick: () => void;
}

export const buttonCommonStyles = css`
  cursor: pointer;
  outline: none;
  border: none;
  font: inherit;
  color: inherit;
  padding: var(--spacing-tiny) var(--spacing-base);
  border-radius: var(--borders-radius);

  &:focus-visible {
    outline: 1px solid var(--focus-color);
  }
`;

const TransparentButton = styled.button`
  ${buttonCommonStyles}
  background-color: hsla(0deg 0% 0% / 0%);

  &:hover {
    background: var(--colors-button-transparent-hover);
  }

  &:active {
    background: var(--colors-button-transparent-active);
  }
`;

const LightButton = styled.button`
  ${buttonCommonStyles}

  background-color: var(--colors-contentBackground-light);

  &:hover {
    background: var(--colors-contentBackground-light-focusable);
  }

  &:active {
    background: var(--colors-contentBackground-light-focused);
  }

  &:disabled {
    cursor: not-allowed;
    color: var(--colors-text-disabled);
    background: var(--colors-contentBackground-light-disabled);
  }
`;

const IconButton = styled(LightButton)`
  padding-left: var(--spacing-tiny);
  padding-right: var(--spacing-tiny);
`;

const Button = ({ className, style, disabled, children, onClick }: Props) => {
  const click = () => {
    if (!disabled) {
      onClick();
    }
  };
  const buttonStyle = style || ButtonStyle.Transparent;
  switch (buttonStyle) {
    case ButtonStyle.Light:
      return (
        <LightButton className={className} disabled={disabled} onClick={click}>
          {children}
        </LightButton>
      );
    case ButtonStyle.Icon:
      return (
        <IconButton className={className} onClick={click}>
          {children}
        </IconButton>
      );
    case ButtonStyle.Transparent:
    default:
      return (
        <TransparentButton className={className} onClick={click}>
          {children}
        </TransparentButton>
      );
  }
};

export default Button;
