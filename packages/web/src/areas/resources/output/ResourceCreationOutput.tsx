import JSONPretty from 'react-json-pretty';
import styled from 'styled-components';

const COLOURS = {
  background: '#282c34',
  main: '#b8bfcb',
  key: '#d46770',
  string: '#8fb874',
  value: '#cf9865',
};

const theme = {
  main: `line-height:1.3;color:${COLOURS.main};background:${COLOURS.background};overflow:auto;`,
  error: `line-height:1.3;color:${COLOURS.main};background:${COLOURS.background};overflow:auto;`,
  key: `color:${COLOURS.key};`,
  string: `color:${COLOURS.string};`,
  value: `color:${COLOURS.value};`,
  boolean: `color:${COLOURS.value};`,
};

const exampleObject = {
  name: 'Jessica',
  age: 47,
  male: false,
  children: ['Paul'],
};

const Wrapper = styled.div`
  background: ${COLOURS.background};
  padding: var(--spacing-base);
`;

const ResourceCreationOutput = () => {
  return (
    <Wrapper>
      <JSONPretty theme={theme} data={exampleObject} />
    </Wrapper>
  );
};

export default ResourceCreationOutput;
