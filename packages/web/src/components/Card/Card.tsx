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
  cardRef?:
    | ((instance: HTMLDivElement | null) => void)
    | React.RefObject<HTMLDivElement>
    | null
    | undefined;
}

const Card = ({ children, className, cardRef }: Props) => {
  return (
    <CardBox ref={cardRef} className={className}>
      {children}
    </CardBox>
  );
};

export default Card;
