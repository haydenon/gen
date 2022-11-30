import styled from 'styled-components';
import ResourceList from './ResourceList';

const Wrapper = styled.div`
  display: grid;

  grid-template-columns: 2fr 3fr;
`;

const ResourceCreator = () => {
  return (
    <Wrapper>
      <ResourceList />
    </Wrapper>
  );
};

export default ResourceCreator;
