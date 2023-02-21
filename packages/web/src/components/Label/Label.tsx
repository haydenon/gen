import styled from 'styled-components';

const Wrapper = styled.label`
  font-size: var(--typography-size-small);
  line-height: var(--typography-lineHeight);
`;

const NonFormWrapper = styled.div`
  font-size: var(--typography-size-small);
  line-height: var(--typography-lineHeight);
`;

const LabelText = styled.div`
  padding-bottom: 6px;
`;

interface Props {
  label: string;
  children: React.ReactNode | React.ReactNode[];
  className?: string;
}

const Label = ({ className, label, children }: Props) => {
  return (
    <Wrapper className={className}>
      <LabelText>{label}</LabelText>
      {children}
    </Wrapper>
  );
};

export const NonFormLabel = ({ className, label, children }: Props) => {
  return (
    <NonFormWrapper className={className}>
      <LabelText>{label}</LabelText>
      {children}
    </NonFormWrapper>
  );
};

export default Label;
