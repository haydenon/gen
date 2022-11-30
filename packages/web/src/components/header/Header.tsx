import styled from 'styled-components';
import DarkModeToggle from '../DarkModeToggle';
import FullWidthWrapper from '../FullWidthWrapper';

const Wrapper = styled.header`
  display: flex;
  justify-content: flex-end;
`;

const Header = () => {
  return (
    <header>
      <FullWidthWrapper>
        <Wrapper>
          <DarkModeToggle />
        </Wrapper>
      </FullWidthWrapper>
    </header>
  );
};

export default Header;
