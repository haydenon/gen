import React, { useEffect, useState } from 'react';
import logo from './logo.svg';
import './App.css';
import { createDesiredState, Generator } from '@haydenon/gen-core';
import Test from './entities/Test';
import DarkModeToggle from './components/dark-mode-toggle/DarkModeToggle';

const generator = Generator.create([createDesiredState(Test, {})]);

function App() {
  const [value, setValue] = useState<any | undefined>(undefined);
  useEffect(() => {
    generator.generateState().then(setValue);
  }, []);
  return (
    <div className="App">
      <DarkModeToggle />
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <p>{JSON.stringify(value)}</p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
