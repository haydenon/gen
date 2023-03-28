import {
  Disclosure as BaseDisclosure,
  DisclosureContent,
  useDisclosureState,
} from 'ariakit/disclosure';
import styled from 'styled-components';
import {
  ButtonColour,
  buttonColours,
  buttonCommonStyles,
  ButtonProps,
} from '../Button/Button';

interface Props {
  label: ((open: boolean) => React.ReactNode) | string;
  children: React.ReactNode | React.ReactNode[];
}

const Wrapper = styled.div<ButtonProps>`
  > button {
    ${buttonCommonStyles}

    padding-left: var(--spacing-tiny);
    padding-right: var(--spacing-tiny);

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
  }
`;

const Disclosure = ({ label, children }: Props) => {
  const disclosure = useDisclosureState();
  return (
    <Wrapper colours={buttonColours[ButtonColour.Transparent]} padding={'var(--spacing-tiny) var(--spacing-base)'}>
      <BaseDisclosure
        state={disclosure}
      >
        {typeof label === 'string' ? label : label(disclosure.open)}
      </BaseDisclosure>
      <DisclosureContent state={disclosure}>{children}</DisclosureContent>
    </Wrapper>
  );
};

export default Disclosure;
