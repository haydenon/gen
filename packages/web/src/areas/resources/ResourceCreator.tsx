import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import Button, { ButtonColour } from '../../components/Button';
import FullWidthWrapper from '../../components/FullWidthWrapper';
import { useDesiredResources } from './desired-resources/desired-resource.hook';
import ResourceList from './ResourceList';
import { Loader } from 'react-feather';

const Wrapper = styled.div``;

const Contents = styled.div`
  display: grid;

  grid-template-columns: 2fr 3fr;
`;

interface BarProps {
  isSticky: boolean;
}

const ActionBar = styled.div<BarProps>`
  top: -1px;
  background-color: var(--colors-background);
  z-index: 1;
  padding: calc(var(--spacing-tiny) + 1px) 0 var(--spacing-tiny) 0;
  width: 100%;
  box-shadow: ${(props) =>
    props.isSticky ? '0px 2px 2px 0px var(--colors-shadow)' : 'unset'};

  position: ${(props) => (props.isSticky ? 'sticky' : 'unset')};
`;

interface HeaderProps {
  children: React.ReactNode | React.ReactNode[];
}

const ActionHeader = ({ children }: HeaderProps) => {
  const [isSticky, setIsSticky] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // mount
  useEffect(() => {
    if (!ref.current) {
      return;
    }

    const cachedRef = ref.current,
      observer = new IntersectionObserver(
        ([e]) => setIsSticky(e.intersectionRatio < 1),
        {
          threshold: [1],
        }
      );

    observer.observe(cachedRef);

    // unmount
    return function () {
      observer.unobserve(cachedRef);
    };
  }, []);

  return (
    <ActionBar id="control-bar" isSticky={isSticky} ref={ref}>
      {children}
    </ActionBar>
  );
};

const HeaderContents = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const CreateButton = styled(Button)`
  display: flex;
  align-items: center;
`;

const Loading = styled(Loader)`
  animation: spin 2s linear infinite;

  width: 1rem;
  height: 1rem;
  margin-left: var(--spacing-tiny);
  margin-right: calc(-1 * var(--spacing-tiny));
  @keyframes spin {
    100% {
      -webkit-transform: rotate(360deg);
      transform: rotate(360deg);
    }
  }
`;

const ResourceCreator = () => {
  const { createDesiredState, isCreating } = useDesiredResources();

  return (
    <Wrapper>
      <ActionHeader>
        <FullWidthWrapper>
          <HeaderContents>
            <CreateButton
              onClick={createDesiredState}
              colour={ButtonColour.Success}
              disabled={isCreating}
            >
              Create
              {isCreating ? <Loading /> : null}
            </CreateButton>
          </HeaderContents>
        </FullWidthWrapper>
      </ActionHeader>
      <FullWidthWrapper>
        <Contents>
          <ResourceList />
        </Contents>
      </FullWidthWrapper>
    </Wrapper>
  );
};

export default ResourceCreator;
