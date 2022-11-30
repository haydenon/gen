import styled from 'styled-components';
import { GlobalStyle } from './styles/global';
import { ThemeStyle } from './styles/theme';
import FullWidthWrapper from './components/FullWidthWrapper';
import Header from './components/header/Header';
import ResourceCreator from './areas/resources/ResourceCreator';

const Wrapper = styled.div`
  min-height: 100%;

  display: grid;

  grid-template-areas:
    'header header'
    'main main';
  grid-template-rows: auto 1fr;
`;

const HeaderWrapper = styled.div`
  grid-area: header;
`;

const Main = styled.main`
  grid-area: main;
`;

function App() {
  return (
    <>
      <Wrapper>
        <HeaderWrapper>
          <Header />
        </HeaderWrapper>
        <Main>
          <FullWidthWrapper>
            <ResourceCreator />
          </FullWidthWrapper>
        </Main>
      </Wrapper>
      <GlobalStyle />
      <ThemeStyle />
    </>
  );
}

export default App;
