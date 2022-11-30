import styled from 'styled-components';
import sun from './sun.png';
import moon from './moon.png';
import ReactSwitch from 'react-switch';
import { useDarkMode } from './dark-mode.hook';

const IconImg = styled.img`
  pointer-events: none;
  margin: 5px 8px 0px 8px;
`;

const checkedIcon = (
  <IconImg
    alt="moon indicating dark mode"
    src={moon}
    width="16"
    height="16"
    role="presentation"
  />
);

const uncheckedIcon = (
  <IconImg
    alt="sun indicating light mode"
    src={sun}
    width="16"
    height="16"
    role="presentation"
  />
);

const DarkModeToggle = () => {
  const { setDarkTheme, isDarkTheme } = useDarkMode();
  const toggleColorMode = () => {
    setDarkTheme(!isDarkTheme);
  };
  return (
    <ReactSwitch
      aria-label="Toggle dark mode"
      onColor="#000"
      checkedIcon={checkedIcon}
      uncheckedIcon={uncheckedIcon}
      checked={isDarkTheme}
      onChange={toggleColorMode}
    />
  );
};

export default DarkModeToggle;
