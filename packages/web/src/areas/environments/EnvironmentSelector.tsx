import { useEffect } from 'react';
import { ItemState } from '../../data';
import { useEnvironments } from './environment.hook';
import styled from 'styled-components';
import Select from '../../components/Select';

const Wrapper = styled.div`
  width: 140px;
`;

const EnvironmentSelector = () => {
  const {
    environments,
    currentEnvironment,
    loadEnvironments,
    setCurrentEnvironment,
  } = useEnvironments();
  useEffect(() => {
    loadEnvironments();
  }, [loadEnvironments]);

  if (environments.state !== ItemState.Completed) {
    return null;
  }

  return (
    <Wrapper>
      <Select
        label={undefined}
        value={currentEnvironment}
        onChange={setCurrentEnvironment}
        options={environments.value}
      />
    </Wrapper>
  );
};

export default EnvironmentSelector;
