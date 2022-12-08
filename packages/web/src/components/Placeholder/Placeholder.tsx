import styled from 'styled-components';

const Placeholder = styled.div`
  @keyframes hintloading {
    0% {
      opacity: 0.2;
    }
    50% {
      opacity: 0.4;
    }
    100% {
      opacity: 0.2;
    }
  }

  border: 1px solid white;
  background-color: var(--colors-text);
  animation: hintloading 2s ease-in-out 0s infinite reverse;
`;

const Wrapper = styled.div`
  padding-bottom: var(--spacing-small);
  &:last-child {
    padding-bottom: 0;
  }
`;

export const SinglePlaceholder = Placeholder;

interface PlaceholderDimensions {
  widthPercentage: number;
  heightRems: number;
}

interface Props {
  placeholders: PlaceholderDimensions[];
}

const Placeholders = ({ placeholders }: Props) => {
  return (
    <>
      {placeholders.map(({ widthPercentage, heightRems }, idx) => (
        <Wrapper key={idx}>
          <Placeholder
            style={{ width: `${widthPercentage}%`, height: `${heightRems}rem` }}
          ></Placeholder>
        </Wrapper>
      ))}
    </>
  );
};

export default Placeholders;
