import styled, { css } from 'styled-components';

export enum ButtonStyle {
  Transparent = 1,
  Normal = 2,
  Icon = 3,
}

export enum ButtonColour {
  Normal = 1,
  Danger = 2,
  Warn = 3,
  Success = 4,
}

interface Props {
  className?: string;
  buttonStyle?: ButtonStyle;
  colour?: ButtonColour;
  children: React.ReactNode | React.ReactNode[];
  disabled?: boolean;
  onClick: () => void;
}

export const buttonCommonStyles = css`
  line-height: var(--typography-lineHeight);
  height: calc(1rem * var(--typography-lineHeight) + (var(--spacing-tiny) * 2));
  cursor: pointer;
  outline: none;
  border: none;
  font: inherit;
  color: inherit;
  padding: var(--spacing-tiny) var(--spacing-base);
  border-radius: var(--borders-radius);

  &:focus,
  &:focus-visible {
    outline: 2px solid #4374cb;
    outline: 5px auto -webkit-focus-ring-color;
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

interface ButtonProps {
  colours: Colours;
}

const NormalButton = styled.button<ButtonProps>`
  ${buttonCommonStyles}

  background-color: ${(props) => props.colours.normal};

  &:hover {
    background: ${(props) => props.colours.hover};
  }

  &:active {
    background: ${(props) => props.colours.focused};
  }

  &:disabled {
    cursor: not-allowed;
    color: var(--colors-text-disabled);
    background: ${(props) => props.colours.disabled};
  }
`;

const IconButton = styled(NormalButton)`
  padding-left: var(--spacing-tiny);
  padding-right: var(--spacing-tiny);
`;

interface Colours {
  normal: string;
  hover: string;
  focused: string;
  disabled: string;
}

const colours: { [colour: number]: Colours } = {
  [ButtonColour.Normal]: {
    normal: 'var(--colors-contentBackground-light)',
    hover: 'var(--colors-contentBackground-light-focusable)',
    focused: 'var(--colors-contentBackground-light-focused)',
    disabled: 'var(--colors-contentBackground-light-disabled)',
  },
  [ButtonColour.Danger]: {
    normal: 'var(--colors-contentBackground-danger)',
    hover: 'var(--colors-contentBackground-danger-focusable)',
    focused: 'var(--colors-contentBackground-danger-focused)',
    disabled: 'var(--colors-contentBackground-danger-disabled)',
  },
  [ButtonColour.Warn]: {
    normal: 'var(--colors-contentBackground-warn)',
    hover: 'var(--colors-contentBackground-warn-focusable)',
    focused: 'var(--colors-contentBackground-warn-focused)',
    disabled: 'var(--colors-contentBackground-warn-disabled)',
  },
  [ButtonColour.Success]: {
    normal: 'var(--colors-contentBackground-success)',
    hover: 'var(--colors-contentBackground-success-focusable)',
    focused: 'var(--colors-contentBackground-success-focused)',
    disabled: 'var(--colors-contentBackground-success-disabled)',
  },
};

const Button = ({
  className,
  buttonStyle: style,
  colour,
  disabled,
  children,
  onClick,
}: Props) => {
  const click = () => {
    if (!disabled) {
      onClick();
    }
  };
  const buttonStyle = style || ButtonStyle.Normal;
  const buttonColours = colours[colour ?? ButtonColour.Normal];
  switch (buttonStyle) {
    case ButtonStyle.Icon:
      return (
        <IconButton
          colours={buttonColours}
          className={className}
          onClick={click}
        >
          {children}
        </IconButton>
      );
    case ButtonStyle.Transparent:
      return (
        <TransparentButton className={className} onClick={click}>
          {children}
        </TransparentButton>
      );
    case ButtonStyle.Normal:
    default:
      return (
        <NormalButton
          colours={buttonColours}
          className={className}
          disabled={disabled}
          onClick={click}
        >
          {children}
        </NormalButton>
      );
  }
};

export default Button;
