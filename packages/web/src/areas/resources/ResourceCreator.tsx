import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import Button, { ButtonColour } from '../../components/Button';
import FullWidthWrapper from '../../components/FullWidthWrapper';
import ResourceList from './ResourceList';

const Wrapper = styled.div``;

const Contents = styled.div`
  display: grid;

  grid-template-columns: 2fr 3fr;
`;

interface BarProps {
  isSticky: boolean;
}

const ActionBar = styled.div<BarProps>`
  position: sticky;
  top: -1px;
  background-color: var(--colors-background);
  z-index: 1;
  padding: calc(var(--spacing-tiny) + 1px) 0 var(--spacing-tiny) 0;
  box-shadow: ${(props) =>
    props.isSticky
      ? '0px 2px 2px 0px var(--colors-background-shadow)'
      : 'unset'};
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
    <ActionBar isSticky={isSticky} ref={ref}>
      {children}
    </ActionBar>
  );
};

const HeaderContents = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const ResourceCreator = () => {
  return (
    <Wrapper>
      <ActionHeader>
        <FullWidthWrapper>
          <HeaderContents>
            <Button onClick={console.log} colour={ButtonColour.Success}>
              Create
            </Button>
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
