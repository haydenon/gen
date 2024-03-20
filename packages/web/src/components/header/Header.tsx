import styled from 'styled-components';
import DarkModeToggle from '../DarkModeToggle';
import FullWidthWrapper from '../FullWidthWrapper';
import EnvironmentSelector from '../../areas/environments/EnvironmentSelector';

const Wrapper = styled.header`
  display: flex;
  justify-content: flex-end;
  align-items: baseline;
  gap: var(--spacing-small);
`;

const Header = () => {
  return (
    <header>
      <FullWidthWrapper>
        <Wrapper>
          <EnvironmentSelector />
          <DarkModeToggle />
        </Wrapper>
      </FullWidthWrapper>
    </header>
  );
};

export default Header;
