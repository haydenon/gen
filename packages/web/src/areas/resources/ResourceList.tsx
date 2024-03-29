import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useState } from 'react';

import styled, { css } from 'styled-components';
import Card from '../../components/Card';
import Placeholder from '../../components/Placeholder';
import { ItemState } from '../../data';
import { DesiredResource } from './desired-resources/desired-resource';
import { useDesiredResources } from './desired-resources/desired-resource.hook';
import { useResources } from './resource.hook';
import ResourceAdd from './ResourceAdd';
import ResourceCard from './ResourceCard';
import { useEnvironments } from '../environments/environment.hook';

interface MaximiseProps {
  open: boolean;
}

const maximisedWrapper = css`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
  height: 100%;
  padding: var(--spacing-base);
  z-index: 2;
`;

const MaximiseWrapper = styled.div<MaximiseProps>`
  ${(props) => (props.open ? maximisedWrapper : undefined)}
`;

const maximisedCard = css`
  width: clamp(500px, 95%, 1000px);
  max-width: 100%;
  height: 100%;
  margin: 0 auto;

  position: relative;
`;

const MaximisedCardWrapper = styled(motion.div)<MaximiseProps>`
  ${(props) => (props.open ? maximisedCard : undefined)}
`;

const ListItem = styled(motion.li)`
  list-style: none;
`;

const Hidden = styled.div`
  visibility: hidden;
`;

const OverlayDiv = styled(motion.div)`
  position: fixed;
  background: rgba(0, 0, 0, 0.8);
  will-change: opacity;
  top: 0;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  opacity: 1;
  z-index: 1;
`;

const Overlay = () => (
  <OverlayDiv
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0, transition: { duration: 0.15 } }}
    transition={{ duration: 0.2, delay: 0.1 }}
    style={{ pointerEvents: 'auto' }}
  />
);

const CloseOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 100%;
  cursor: pointer;
`;

const List = styled.ul`
  padding-left: 0;
  margin: 0;
`;

const PlaceholderResource = () => {
  return (
    <Card>
      <Placeholder
        placeholders={[
          { heightRems: 1.5, widthPercentage: 60 },
          { heightRems: 1.2, widthPercentage: 45 },
          { heightRems: 1.2, widthPercentage: 40 },
          { heightRems: 1.2, widthPercentage: 43 },
        ]}
      />
    </Card>
  );
};

interface Props {
  onMaximise: (isMaximised: boolean) => void;
}

const ResourceList = ({ onMaximise }: Props) => {
  const { currentEnvironment } = useEnvironments();
  const { desiredResources, updateResource, deleteResource, addResource } =
    useDesiredResources();
  const [maximised, setMaximised] = useState<number | undefined>(undefined);

  const { loadResourceDefinitions, resources } = useResources();
  useEffect(() => {
    loadResourceDefinitions();
  }, [loadResourceDefinitions]);

  const onChange = useCallback(
    (resource: DesiredResource) => {
      updateResource(resource);
    },
    [updateResource]
  );

  const closeMaximised = useCallback(() => {
    onMaximise(false);
    setMaximised(undefined);
  }, [onMaximise, setMaximised]);

  const onDelete = useCallback(
    (id: string) => () => {
      closeMaximised();
      deleteResource(id);
    },
    [deleteResource, closeMaximised]
  );

  const onMaximiseChange = useCallback(
    (idx: number) => () => {
      if (idx === maximised) {
        closeMaximised();
      } else {
        if (maximised === undefined) {
          onMaximise(true);
        }
        setMaximised(idx);
      }
    },
    [onMaximise, setMaximised, closeMaximised, maximised]
  );

  // Remove scrolling on background when modal is open
  useEffect(() => {
    const body = document.body;

    const styles = {
      overflowY: 'hidden',
      position: 'fixed',
      width: '100%',
    };

    const remove = () => {
      const top = document.body.style.top;

      for (const style in styles) {
        body.style[style as any] = '';
      }

      if (top) {
        const value = /(-?\d*\.?\d+)px/.exec(top);
        if (value?.length) {
          document.body.style.top = '';
          window.scrollTo(0, parseInt(value[1] || '0') * -1);
        }
      }
    };

    if (maximised !== undefined) {
      body.style.top = `-${window.scrollY}px`;
      for (const style in styles) {
        body.style[style as any] = (styles as any)[style as any];
      }
    } else {
      remove();
    }

    return remove;
  }, [maximised]);

  if (
    currentEnvironment === undefined ||
    resources.state !== ItemState.Completed ||
    desiredResources.state !== ItemState.Completed
  ) {
    return (
      <List>
        {[...new Array(5).keys()].map((i) => (
          <ListItem key={i}>
            <PlaceholderResource />
          </ListItem>
        ))}
      </List>
    );
  }

  return (
    <List>
      <AnimatePresence>
        {[
          ...desiredResources.value.map((r, i) => (
            <ListItem
              key={r.id}
              initial={{ height: '0px', overflowY: 'hidden' }}
              variants={{
                added: {
                  height: 'unset',
                  overflowY: 'unset',
                },
                maximised: {
                  position: 'relative',
                  zIndex: 1,
                },
                minimised: {
                  position: 'unset',
                  zIndex: 'unset',
                  transition: {
                    delay: 0.3,
                  },
                },
              }}
              animate={[
                'added',
                ...(maximised === i ? ['maximised'] : ['minimised']),
              ]}
              exit={{
                height: '0px',
                overflowY: 'hidden',
                transition: { duration: maximised === i ? 0 : 0.3 },
              }}
            >
              {maximised === i ? <Overlay /> : null}
              <MaximiseWrapper open={i === maximised}>
                <MaximisedCardWrapper open={i === maximised} layout>
                  {maximised === i ? (
                    <CloseOverlay onClick={closeMaximised} />
                  ) : null}
                  <ResourceCard
                    resource={r}
                    onChange={onChange}
                    onDelete={onDelete(r.id)}
                    onMaximiseToggle={onMaximiseChange(i)}
                    maximised={i === maximised}
                  ></ResourceCard>
                </MaximisedCardWrapper>
              </MaximiseWrapper>
              {maximised === i ? (
                <Hidden>
                  {/* Used to preserve correct height for element. TODO: Replace this with a better method */}
                  <ResourceCard
                    resource={r}
                    onChange={() => {}}
                    onDelete={() => {}}
                    onMaximiseToggle={() => {}}
                  ></ResourceCard>
                </Hidden>
              ) : null}
            </ListItem>
          )),
          <ListItem key="add">
            <ResourceAdd onAdd={addResource} resources={resources.value} />
          </ListItem>,
        ]}
      </AnimatePresence>
    </List>
  );
};

export default ResourceList;
