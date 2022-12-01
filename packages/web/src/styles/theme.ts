import { createGlobalStyle, css } from 'styled-components';

const lightTheme = css`
  /* Background  */
  --colors-background: hsl(0deg 0% 100%);
  --colors-background-focusable: hsl(0deg 0% 92%);
  --colors-background-focused: hsl(0deg 0% 96%);

  /* Content background  */
  --colors-contentBackground: hsl(0deg 0% 90%);
  --colors-contentBackground-focusable: hsl(0deg 0% 82%);
  --colors-contentBackground-focused: hsl(0deg 0% 86%);

  --colors-contentBackground-light: hsl(0deg 0% 84%);
  --colors-contentBackground-light-focusable: hsl(0deg 0% 80%);
  --colors-contentBackground-light-focused: hsl(0deg 0% 82%);
  --colors-contentBackground-light-disabled: hsl(0deg 0% 60%);

  --colors-text: hsla(0deg 0% 0% / 95%);

  /* Buttons */
  --colors-button-transparent-hover: hsl(0deg 0% 0% / 10%);
  --colors-button-transparent-active: hsl(0deg 0% 0% / 5%);
`;

const darkTheme = css`
  /* Background  */
  --colors-background: hsl(200deg 15% 10%);
  --colors-background-focusable: hsl(200deg 15% 18%);
  --colors-background-focused: hsl(200deg 15% 14%);

  /* Content background  */
  --colors-contentBackground: hsl(200deg 5% 20%);
  --colors-contentBackground-focusable: hsl(200deg 5% 28%);
  --colors-contentBackground-focused: hsl(200deg 5% 24%);

  --colors-contentBackground-light: hsl(200deg 5% 26%);
  --colors-contentBackground-light-focusable: hsl(200deg 5% 32%);
  --colors-contentBackground-light-focused: hsl(200deg 5% 29%);
  --colors-contentBackground-light-disabled: hsl(200deg 5% 60%);

  --colors-text: hsla(0deg 0% 100% / 95%);

  /* Buttons */
  --colors-button-transparent-hover: hsl(0deg 0% 100% / 10%);
  --colors-button-transparent-active: hsl(0deg 0% 100% / 5%);

  [data-reach-dialog-overlay] {
    background: hsla(0, 100%, 100%, 0.33);
  }
`;

export const ThemeStyle = createGlobalStyle`
:root {
  /* Spacing */
  --spacing-tiny: 8px;
  --spacing-small: 16px;
  --spacing-base: 24px;
  --spacing-large: 32px;
  --spacing-extraLarge: 40px;

  /* Borders */
  --borders-radius: 4px;
  --borders-width: 1px;

  /* Typography */
  --typography-size-header-1: 3rem;
  --typography-size-header-2: 2.4rem;
  --typography-size-header-3: 1.8rem;
  --typography-size-header-4: 1.4rem;
  --typography-size-paragraph: 1rem;
  --typography-lineHeight: 1.4;

  --transition-duration-background: 0.3s;
  --transition-duration-font: 0.5s;
}

@media (prefers-color-scheme: dark) {
  :root {
    ${darkTheme}
  }
}

@media (prefers-color-scheme: light) {
  :root {
    ${lightTheme}
  }
}

body.dark-theme  {
  ${darkTheme}
}

body.light-theme  {
  ${lightTheme}
}
`;
