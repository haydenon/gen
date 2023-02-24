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
  return label ? (
    <Wrapper className={className}>
      <LabelText>{label}</LabelText>
      {children}
    </Wrapper>
  ) : (
    <div className={className}>{children}</div>
  );
};

export const NonFormLabel = ({ className, label, children }: Props) => {
  return label ? (
    <NonFormWrapper className={className}>
      <LabelText>{label}</LabelText>
      {children}
    </NonFormWrapper>
  ) : (
    <div className={className}>{children}</div>
  );
};

export default Label;
