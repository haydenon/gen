import { forwardRef } from 'react';
import styled from 'styled-components';

const CardBox = styled.div`
  background-color: var(--colors-contentBackground);
  border-radius: var(--borders-radius);
  padding: var(--spacing-base) var(--spacing-large);
  margin-bottom: var(--spacing-base);
`;

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode | React.ReactNode[];
  className?: string;
  cardRef?:
    | ((instance: HTMLDivElement | null) => void)
    | React.RefObject<HTMLDivElement>
    | null
    | undefined;
}

const Card = forwardRef<HTMLDivElement, Props>(
  ({ children, className, cardRef, ...props }, ref) => {
    return (
      <CardBox ref={ref || cardRef} className={className} {...props}>
        {children}
      </CardBox>
    );
  }
);

Card.displayName = 'Card';

export default Card;
