import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { PlusCircle } from 'react-feather';

import styled, { css } from 'styled-components';
import Button, { ButtonColour } from '../../components/Button';
import Card from '../../components/Card';
import Placeholder from '../../components/Placeholder';
import { ItemState } from '../../data';
import { DesiredResource } from './desired-resources/desired-resource';
import { useDesiredResources } from './desired-resources/desired-resource.hook';
import { useResources } from './resource.hook';
import ResourceCard from './ResourceCard';

const AddWrapper = styled.div`
  display: flex;
`;

const AddButton = styled(Button)`
  flex: 1;
  display: flex;
  justify-content: center;
  padding: calc(var(--spacing-tiny) * 1.5) 0;
`;

const AddIcon = styled(PlusCircle)`
  margin-left: var(--spacing-tiny);
`;

interface AddProps {
  onAdd: () => void;
}

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

const ResourceAdd = ({ onAdd }: AddProps) => {
  return (
    <AddWrapper>
      <AddButton colour={ButtonColour.Transparent} onClick={onAdd}>
        Add resource <AddIcon size={18 * 1.2} />
      </AddButton>
    </AddWrapper>
  );
};

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

const ResourceList = () => {
  const { desiredResources, updateResource, deleteResource, addResource } =
    useDesiredResources();
  const [maximised, setMaximised] = useState<number | undefined>(undefined);

  const { loadResourceDefinitions, resources } = useResources();
  useEffect(() => {
    loadResourceDefinitions();
  }, [loadResourceDefinitions]);

  const onChange = (resource: DesiredResource) => {
    updateResource(resource);
  };
  const onDelete = (id: string) => () => {
    setMaximised(undefined);
    deleteResource(id);
  };
  const onAdd = () => {
    addResource();
  };
  const onMaximise = (idx: number) => () => {
    if (idx === maximised) {
      setMaximised(undefined);
    } else {
      setMaximised(idx);
    }
  };

  // Remove scrolling on background when modal is open
  useEffect(() => {
    // TODO: This is pretty dirty at the moment, need to find a cleaner way to do this
    const body = document.body;
    const controlBar = document.getElementById('control-bar');

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

      let offset = 0;
      if (controlBar?.style?.position === 'fixed') {
        controlBar.style.position = 'sticky';
        const controlBarBounds = controlBar.getBoundingClientRect();
        offset = controlBarBounds.height;
      }

      if (top) {
        const value = /(-?\d*\.?\d+)px/.exec(top);
        if (value?.length) {
          document.body.style.top = '';
          window.scrollTo(0, parseInt(value[1] || '0') * -1 + offset);
        }
      }
    };

    if (maximised !== undefined) {
      const controlBarBounds = controlBar?.getBoundingClientRect();
      if (controlBar && controlBarBounds && controlBarBounds.top < 0) {
        controlBar.style.position = 'fixed';
      }
      let offset = window.scrollY;
      if (controlBarBounds && controlBarBounds.top < 0) {
        offset -= controlBarBounds.height;
      }
      body.style.top = `-${offset}px`;
      for (const style in styles) {
        body.style[style as any] = (styles as any)[style as any];
      }
    } else {
      remove();
    }

    return remove;
  }, [maximised]);

  if (
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
              animate={{
                height: 'unset',
                overflowY: 'unset',
              }}
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
                    <CloseOverlay onClick={() => setMaximised(undefined)} />
                  ) : null}
                  <ResourceCard
                    resource={r}
                    onChange={onChange}
                    onDelete={onDelete(r.id)}
                    onMaximiseToggle={onMaximise(i)}
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
            <ResourceAdd onAdd={onAdd} />
          </ListItem>,
        ]}
      </AnimatePresence>
    </List>
  );
};

export default ResourceList;
