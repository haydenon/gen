import styled from 'styled-components';

import Input from '../../../components/Input';

const FieldInput = styled(Input)``;

const Wrapper = styled.div`
  margin-top: calc(-1 * var(--labelOffset));
`;

interface OffsetWrapperProps {
  children: React.ReactNode | React.ReactNode[];
  offset: boolean;
  className?: string;
}

export const OffsetWrapper = ({
  offset,
  children,
  className,
}: OffsetWrapperProps) => {
  return offset ? (
    <Wrapper className={className}>{children}</Wrapper>
  ) : (
    <div className={className}>{children}</div>
  );
};

export default FieldInput;
