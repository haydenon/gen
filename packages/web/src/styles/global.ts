import { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
  html {
    font-size: 1.125rem;
    font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto,
      Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue,
      sans-serif;
  }

  html,
  body,
  body > div {
    padding: 0;
    margin: 0;
    height: 100%;
  }

  body {
    background-color: var(--colors-background);
    transition: background-color var(--transition-duration-background);
    transition: color var(--transition-duration-font);
    color: var(--colors-text);
  }

  button {
    color: var(--colors-text);
  }

  .app-container {
    min-height: 100%;
  }

  h1, h2, h3, h4, h5 {
    margin: 0;
    padding: var(--spacing-base) 0
  }

  p {
    margin: 0;
    line-height: var(--typography-lineHeight);
  }

  p:not(::last-child) {
    padding-bottom: var(--spacing-small);
  }

  h1 {
    font-size: var(--typography-size-header-1);
  }

  h2 {
    font-size: var(--typography-size-header-2);
  }

  h3 {
    font-size: var(--typography-size-header-3);
  }

  h4 {
    font-size: var(--typography-size-header-4);
  }

  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }
`;
