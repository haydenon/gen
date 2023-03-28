import { createGlobalStyle, css } from 'styled-components';

const lightTheme = css`
  /* Background  */
  --colors-background: hsl(0deg 0% 100%);
  --colors-background-focusable: hsl(0deg 0% 92%);
  --colors-background-focused: hsl(0deg 0% 96%);

  /* Shadows */
  --colors-shadow: hsl(0deg 0% 80%);

  /* Content background  */
  --colors-contentBackground: hsl(0deg 0% 90%);
  --colors-contentBackground-focusable: hsl(0deg 0% 82%);
  --colors-contentBackground-focused: hsl(0deg 0% 86%);
  --colors-contentBackground-dark: hsl(0deg 0% 78%);

  --colors-contentBackground-light: hsl(0deg 0% 84%);
  --colors-contentBackground-light-focusable: hsl(0deg 0% 80%);
  --colors-contentBackground-light-focused: hsl(0deg 0% 82%);
  --colors-contentBackground-light-disabled: hsl(0deg 0% 60%);

  --colors-contentBackground-checkbox: hsl(202deg 83% 45%);
  --colors-contentBackground-checkbox-focusable: hsl(202deg 83% 52%);
  --colors-contentBackground-checkbox-focused: hsl(202deg 83% 48%);
  --colors-contentBackground-checkbox-disabled: hsl(202deg 83% 74%);

  --colors-contentBackground-danger: hsl(0deg 100% 79%);
  --colors-contentBackground-danger-focusable: hsl(0deg 100% 75%);
  --colors-contentBackground-danger-focused: hsl(0deg 100% 78%);
  --colors-contentBackground-danger-disabled: hsl(0, 60%, 48%);

  --colors-contentBackground-warn: hsl(40deg, 100%, 80%);
  --colors-contentBackground-warn-focusable: hsl(40deg, 100%, 76%);
  --colors-contentBackground-warn-focused: hsl(40deg 100% 78%);
  --colors-contentBackground-warn-disabled: hsl(40, 100%, 40%);

  --colors-contentBackground-success: hsl(144deg 89% 65%);
  --colors-contentBackground-success-focusable: hsl(144deg 89% 55%);
  --colors-contentBackground-success-focused: hsl(144deg 89% 60%);
  --colors-contentBackground-success-disabled: hsl(144deg 89% 30%);

  --colors-text: hsla(0deg 0% 0% / 95%);
  --colors-text-danger: hsla(0deg 87% 38% / 97%);
  --colors-border: hsla(0deg 0% 0% / 30%);

  --colors-checkbox: hsla(0deg 0% 100% / 95%);
  --colors-checkbox-focusable: hsla(0deg 0% 96% / 95%);
  --colors-checkbox-focused: hsla(0deg 0% 98% / 95%);
  --colors-checkbox-disabled: hsla(0deg 0% 85% / 95%);

  /* Buttons */
  --colors-button-transparent-hover: hsl(0deg 0% 0% / 10%);
  --colors-button-transparent-active: hsl(0deg 0% 0% / 5%);

  /* Code */
  --code-background: hsl(0deg 0% 94%);
  --code-main: hsl(240deg 63% 74%);
  --code-key: hsl(206deg 26% 49%);
  --code-string: hsl(93deg 75% 36%);
  --code-value: hsl(8deg 82% 37.62%);
`;

const darkTheme = css`
  /* Background  */
  --colors-background: hsl(220deg 15% 10%);
  --colors-background-focusable: hsl(220deg 15% 18%);
  --colors-background-focused: hsl(220deg 15% 14%);
  --colors-shadow: hsl(220deg 15% 7%);

  /* Content background  */
  --colors-contentBackground: hsl(220deg 13% 18%);
  --colors-contentBackground-focusable: hsl(220deg 13% 26%);
  --colors-contentBackground-focused: hsl(220deg 13% 22%);
  --colors-contentBackground-dark: hsl(220deg 13% 14%);

  --colors-contentBackground-light: hsl(220deg 13% 26%);
  --colors-contentBackground-light-focusable: hsl(220deg 13% 32%);
  --colors-contentBackground-light-focused: hsl(220deg 13% 29%);
  --colors-contentBackground-light-disabled: hsl(220deg 13% 60%);

  --colors-contentBackground-checkbox: hsl(202deg 83% 45%);
  --colors-contentBackground-checkbox-focusable: hsl(202deg 83% 52%);
  --colors-contentBackground-checkbox-focused: hsl(202deg 83% 48%);
  --colors-contentBackground-checkbox-disabled: hsl(202deg 83% 74%);

  --colors-contentBackground-danger: hsl(0, 83%, 45%);
  --colors-contentBackground-danger-focusable: hsl(0, 83%, 54%);
  --colors-contentBackground-danger-focused: hsl(0deg 87% 50%);
  --colors-contentBackground-danger-disabled: hsl(0deg 87% 70%);

  --colors-contentBackground-warn: hsl(40deg, 80%, 34%);
  --colors-contentBackground-warn-focusable: hsl(40deg, 80%, 40%);
  --colors-contentBackground-warn-focused: hsl(40deg, 80%, 38%);
  --colors-contentBackground-warn-disabled: hsl(40, 61.3%, 63.5%);

  --colors-contentBackground-success: hsl(144deg 89% 25%);
  --colors-contentBackground-success-focusable: hsl(144deg 89% 31%);
  --colors-contentBackground-success-focused: hsl(144deg 89% 29%);
  --colors-contentBackground-success-disabled: hsl(144deg 89% 60%);

  --colors-text: hsla(0deg 0% 100% / 95%);
  --colors-text-danger: hsla(0deg 100% 79% / 97%);
  --colors-border: hsla(0deg 0% 100% / 30%);

  --colors-checkbox: hsla(0deg 0% 100% / 95%);
  --colors-checkbox-focusable: hsla(0deg 0% 94% / 95%);
  --colors-checkbox-focused: hsla(0deg 0% 97% / 95%);
  --colors-checkbox-disabled: hsla(0deg 0% 70% / 95%);

  /* Buttons */
  --colors-button-transparent-hover: hsl(0deg 0% 100% / 10%);
  --colors-button-transparent-active: hsl(0deg 0% 100% / 5%);

  [data-reach-dialog-overlay] {
    background: hsla(0, 100%, 100%, 0.33);
  }

  /* Code */
  --code-background: var(--colors-contentBackground);
  --code-main: hsl(218deg 15% 76%);
  --code-key: hsl(355deg 56% 62%);
  --code-string: hsl(96deg 32% 59%);
  --code-value: hsl(29deg 52% 60%);
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
  --typography-size-header-5: 1.1rem;
  --typography-size-paragraph: 1rem;
  --typography-size-small: 0.75rem;
  --typography-lineHeight: 1.4;

  --transition-duration-background: 0.3s;
  --transition-duration-font: 0.5s;

  --content-padding: var(--spacing-tiny);
  --content-height: calc(1rem * var(--typography-lineHeight) + (var(--content-padding) * 2));
}

@media (prefers-color-scheme: dark) {
  :root {
    color-scheme: dark;
    ${darkTheme}
  }
}

@media (prefers-color-scheme: light) {
  :root {
  color-scheme: light;
    ${lightTheme}
  }
}

body.dark-theme  {
  color-scheme: dark;
  ${darkTheme}
}

body.light-theme  {
  color-scheme: light;
  ${lightTheme}
}
`;
