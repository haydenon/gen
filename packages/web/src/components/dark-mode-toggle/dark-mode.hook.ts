import { useCallback, useEffect, useState } from 'react';
import useLocalStorage from 'react-use-localstorage';

export const useDarkMode = () => {
  const [storedDarkMode, setStoredMode] = useLocalStorage(
    'Preferences.DarkMode',
    undefined
  );
  const [browserTheme, setBrowserTheme] = useState(false);
  const [userTheme, setUserTheme] = useState<boolean | undefined>(undefined);

  const isDarkTheme = userTheme !== undefined ? userTheme : browserTheme;

  useEffect(() => {
    if (userTheme === undefined && storedDarkMode) {
      setUserTheme(storedDarkMode.toLowerCase() === 'true');
    }
  }, [userTheme, storedDarkMode]);

  const setUserDefinedTheme = useCallback(
    (isDarkMode: boolean) => {
      setUserTheme(isDarkMode);
      setStoredMode(isDarkMode.toString());
    },
    [setUserTheme, setStoredMode]
  );

  useEffect(() => {
    const listener = (e: MediaQueryListEvent) => {
      setBrowserTheme(e.matches);
    };

    const matchMedia = window.matchMedia('(prefers-color-scheme: dark)');
    matchMedia.addEventListener('change', listener);

    setBrowserTheme(matchMedia.matches);

    return () => matchMedia.removeEventListener('change', listener);
  }, []);

  useEffect(() => {
    if (isDarkTheme) {
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
    } else {
      document.body.classList.add('light-theme');
      document.body.classList.remove('dark-theme');
    }
  }, [isDarkTheme]);

  return {
    setDarkTheme: setUserDefinedTheme,
    isDarkTheme,
  };
};
