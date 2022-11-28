import styled from 'styled-components';

const FullWidthWrapper = styled.div`
  width: clamp(500px, 90%, 1800px);
  max-width: 100%;

  margin: 0 auto;
  padding: var(--spacing-small);
`;

export default FullWidthWrapper;
