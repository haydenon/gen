import styled from 'styled-components';

const Wrapper = styled.div`
  &:not(:last-child) {
    padding-bottom: var(--spacing-base);
  }
`;

const CardBox = styled.div`
  background-color: var(--colors-contentBackground);
  border-radius: var(--borders-radius);
  padding: var(--spacing-small);
`;

interface Props {
  children?: React.ReactNode | React.ReactNode[];
}

const Card = ({ children }: Props) => {
  return (
    <Wrapper>
      <CardBox>{children}</CardBox>
    </Wrapper>
  );
};

export default Card;
