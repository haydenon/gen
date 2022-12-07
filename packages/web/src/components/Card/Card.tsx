import styled from 'styled-components';

const CardBox = styled.div`
  background-color: var(--colors-contentBackground);
  border-radius: var(--borders-radius);
  padding: var(--spacing-small);
  margin-bottom: var(--spacing-base);
`;

interface Props {
  children?: React.ReactNode | React.ReactNode[];
  className?: string;
}

const Card = ({ children, className }: Props) => {
  return <CardBox className={className}>{children}</CardBox>;
};

export default Card;
