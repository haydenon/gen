import React, { useEffect, useState } from 'react';
import { createDesiredState, Generator } from '@haydenon/gen-core';
import Test from './entities/Test';
import styled from 'styled-components';
import { GlobalStyle } from './styles/global';
import { ThemeStyle } from './styles/theme';
import FullWidthWrapper from './components/full-width-wrapper/FullWidthWrapper';
import Header from './components/header/Header';

const generator = Generator.create([createDesiredState(Test, {})]);

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
  const [value, setValue] = useState<any | undefined>(undefined);
  useEffect(() => {
    generator.generateState().then(setValue);
  }, []);
  return (
    <>
      <Wrapper>
        <HeaderWrapper>
          <Header />
        </HeaderWrapper>
        <Main>
          <FullWidthWrapper>
            <p>{JSON.stringify(value)}</p>
          </FullWidthWrapper>
        </Main>
      </Wrapper>
      <GlobalStyle />
      <ThemeStyle />
    </>
  );
}

export default App;
