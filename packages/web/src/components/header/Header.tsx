import styled from 'styled-components';
import DarkModeToggle from '../dark-mode-toggle/DarkModeToggle';
import FullWidthWrapper from '../full-width-wrapper/FullWidthWrapper';

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
