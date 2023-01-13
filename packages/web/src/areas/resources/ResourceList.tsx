import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { PlusCircle } from 'react-feather';

import styled, { css } from 'styled-components';
import Button, { ButtonStyle } from '../../components/Button';
import Card from '../../components/Card';
import Placeholder from '../../components/Placeholder';
import { ItemState } from '../../data';
import { useResources } from './resource.hook';
import ResourceCard from './ResourceCard';

export interface Resource {
  id: number;
  type?: string;
  name?: string;
}

let resourceId = 1;

const resourceItems: Resource[] = [
  {
    id: resourceId++,
    type: 'Service',
    name: 'SomeService',
  },
  {
    id: resourceId++,
    type: 'Product',
    name: 'SomeProduct',
  },
  {
    id: resourceId++,
    type: 'Product',
    name: 'OtherProduct',
  },
  {
    id: resourceId++,
    type: 'Member',
    name: 'SomeMember',
  },
  {
    id: resourceId++,
    type: 'Order',
    name: 'Order',
  },
];

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
      <AddButton style={ButtonStyle.Transparent} onClick={onAdd}>
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
  const [values, setValues] = useState<Resource[]>(resourceItems);
  const [maximised, setMaximised] = useState<number | undefined>(undefined);

  const { loadResourceDefinitions, resources } = useResources();
  useEffect(() => {
    loadResourceDefinitions();
  }, [loadResourceDefinitions]);

  const onChange = (idx: number) => (resource: Resource) => {
    setValues([...values.slice(0, idx), resource, ...values.slice(idx + 1)]);
  };
  const onDelete = (idx: number) => () => {
    setMaximised(undefined);
    setValues([...values.slice(0, idx), ...values.slice(idx + 1)]);
  };
  const onAdd = () => {
    setValues([
      ...values,
      {
        id: resourceId++,
      },
    ]);
  };
  const onMaximise = (idx: number) => () => {
    if (idx === maximised) {
      setMaximised(undefined);
    } else {
      setMaximised(idx);
    }
  };

  if (resources.state !== ItemState.Completed) {
    return (
      <ul>
        {[...new Array(5).keys()].map((i) => (
          <ListItem key={i}>
            <PlaceholderResource />
          </ListItem>
        ))}
      </ul>
    );
  }

  return (
    <ul>
      <AnimatePresence>
        {[
          ...values.map((r, i) => (
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
                    onChange={onChange(i)}
                    onDelete={onDelete(i)}
                    onMaximiseToggle={onMaximise(i)}
                    maximised={i === maximised}
                  ></ResourceCard>
                </MaximisedCardWrapper>
              </MaximiseWrapper>
              {maximised === i ? (
                <Hidden>
                  {/* Used to preserve correct height for element */}
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
    </ul>
  );
};

export default ResourceList;
