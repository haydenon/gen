import JSONPretty from 'react-json-pretty';
import styled from 'styled-components';

const COLOURS = {
  background: 'var(--code-background)',
  main: 'var(--code-main)',
  key: 'var(--code-key)',
  string: 'var(--code-string)',
  value: 'var(--code-value)',
};

const theme = {
  main: `line-height:1.3;color:${COLOURS.main};background:inherit;overflow:auto;`,
  error: `line-height:1.3;color:${COLOURS.main};background:inherit;overflow:auto;`,
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
  border-radius: var(--borders-radius);

  & pre {
    margin: 0;
  }
`;

const ResourceCreationOutput = () => {
  return (
    <Wrapper>
      <JSONPretty theme={theme} data={exampleObject} />
    </Wrapper>
  );
};

export default ResourceCreationOutput;
