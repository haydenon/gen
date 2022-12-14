import styled from 'styled-components';

const Wrapper = styled.label`
  font-size: var(--typography-size-small);
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

export default Label;
