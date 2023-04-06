import { Loader as BaseLoader } from 'react-feather';
import styled from 'styled-components';

const Loader = styled(BaseLoader)`
  animation: spin 2s linear infinite;

  width: 1rem;
  height: 1rem;
  margin-left: var(--spacing-tiny);
  margin-right: calc(-1 * var(--spacing-tiny));
  @keyframes spin {
    100% {
      -webkit-transform: rotate(360deg);
      transform: rotate(360deg);
    }
  }
`;

export default Loader;
