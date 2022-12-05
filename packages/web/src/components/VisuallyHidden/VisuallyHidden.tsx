import { useEffect, useState } from 'react';
import styled from 'styled-components';

const Wrapper = styled.span`
  position: absolute;
  overflow: hidden;
  clip: rect(0 0 0 0);
  height: 1px;
  width: 1px;
  margin: -1px;
  padding: 0;
  border: 0;
`;

interface Props {
  children?: React.ReactNode | React.ReactNode[];
}

const VisuallyHidden = ({ children }: Props) => {
  const [showText, setShow] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') {
      return () => {};
    }

    const SHIFT = 'Shift';

    const onKeyDown = ({ key }: KeyboardEvent) => {
      if (key === SHIFT) {
        setShow(true);
      }
    };

    const onKeyUp = ({ key }: KeyboardEvent) => {
      if (key === SHIFT) {
        setShow(false);
      }
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  if (showText) {
    return <span>{children}</span>;
  }

  return <Wrapper>{children}</Wrapper>;
};
export default VisuallyHidden;
