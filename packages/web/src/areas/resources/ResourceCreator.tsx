import { useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import Button, { ButtonColour } from '../../components/Button';
import FullWidthWrapper from '../../components/FullWidthWrapper';
import { useDesiredResources } from './desired-resources/desired-resource.hook';
import ResourceList from './ResourceList';
import ResourceCreationOutput from './output/ResourceCreationOutput';
import Loader from '../../components/Loader';

const Wrapper = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const Contents = styled.div`
  flex: 1;
  display: grid;

  grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);

  gap: var(--spacing-extraLarge);
`;

interface BarProps {
  isSticky: boolean;
  isModalMaximised: boolean;
}

const ActionBarPlaceholder = styled.div`
  height: calc(
    1rem * var(--typography-lineHeight) + (var(--spacing-large) * 2)
  );
`;

const ActionBar = styled.div<BarProps>`
  top: -1px;
  background-color: var(--colors-background);
  z-index: 1;
  padding: calc(var(--spacing-tiny) + 1px) 0 var(--spacing-tiny) 0;
  width: 100%;
  box-shadow: ${(props) =>
    props.isSticky ? '0px 2px 2px 0px var(--colors-shadow)' : 'unset'};

  position: ${(props) =>
    props.isSticky ? (props.isModalMaximised ? 'fixed' : 'sticky') : 'unset'};
`;

interface HeaderProps {
  children: React.ReactNode | React.ReactNode[];
  isModalMaximised: boolean;
}

const ActionHeader = ({ children, isModalMaximised }: HeaderProps) => {
  const [isSticky, setIsSticky] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const currentRef = ref?.current;

  // mount
  useEffect(() => {
    if (!currentRef) {
      return;
    }

    const cachedRef = currentRef,
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
  }, [currentRef]);

  return (
    <>
      {isSticky && isModalMaximised ? (
        <ActionBarPlaceholder></ActionBarPlaceholder>
      ) : null}
      <ActionBar
        isModalMaximised={isModalMaximised}
        isSticky={isSticky}
        ref={ref}
      >
        {children}
      </ActionBar>
    </>
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

const ContentWrapper = styled(FullWidthWrapper)`
  flex: 1;
  display: flex;
  flex-direction: column;
  padding-bottom: var(--spacing-large);
`;

const ResourceCreator = () => {
  const { desiredResources, createDesiredState, isCreating, creatingState } =
    useDesiredResources();
  const [maximised, setMaximised] = useState(false);

  const resources = useMemo(
    () => desiredResources?.value ?? [],
    [desiredResources]
  );

  return (
    <Wrapper>
      <ActionHeader isModalMaximised={maximised}>
        <FullWidthWrapper>
          <HeaderContents>
            <CreateButton
              onClick={createDesiredState}
              colour={ButtonColour.Success}
              disabled={isCreating}
            >
              Create
              {isCreating ? <Loader /> : null}
            </CreateButton>
          </HeaderContents>
        </FullWidthWrapper>
      </ActionHeader>
      <ContentWrapper>
        <Contents>
          <ResourceList onMaximise={setMaximised} />
          <ResourceCreationOutput
            resources={resources}
            creatingState={creatingState}
          />
        </Contents>
      </ContentWrapper>
    </Wrapper>
  );
};

export default ResourceCreator;
