import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import styled from 'styled-components';
import Card from '../Card';
import Button, { ButtonColour } from '../Button/Button';
import Input, { TextArea } from '../Input/Input';

interface SaveScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (title: string, description: string) => Promise<void>;
}

const Overlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--spacing-base);
`;

const ModalCard = styled(motion(Card))`
  width: clamp(400px, 90%, 600px);
  max-width: 100%;
  position: relative;
  z-index: 1001;
`;

const Title = styled.h2`
  margin-top: 0;
  margin-bottom: var(--spacing-base);
  font-size: 1.5rem;
`;

const ButtonRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-small);
  margin-top: var(--spacing-base);
`;

const ErrorMessage = styled.div`
  color: var(--colour-error);
  margin-top: var(--spacing-small);
  font-size: 0.9rem;
`;

const SuccessMessage = styled.div`
  color: var(--colour-success);
  margin-top: var(--spacing-small);
  font-size: 0.9rem;
`;

const SaveScenarioModal = ({
  isOpen,
  onClose,
  onSave,
}: SaveScenarioModalProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Please enter a title');
      return;
    }

    setLoading(true);
    setError(undefined);
    setSuccess(false);

    try {
      await onSave(title, description);
      setSuccess(true);
      setTitle('');
      setDescription('');

      // Auto-close after a short delay
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 1500);
    } catch (err) {
      const error = err as Error;
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setTitle('');
      setDescription('');
      setError(undefined);
      setSuccess(false);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <Overlay
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <ModalCard
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <Title>Save Scenario</Title>

            <Input
              label="Title"
              value={title}
              onChange={setTitle}
              placeholder="Enter a title for this scenario"
            />

            <TextArea
              label="Description (optional)"
              value={description}
              onChange={setDescription}
              placeholder="Add a description to help you remember what this scenario is for"
              disabled={loading}
            />

            {error && <ErrorMessage>{error}</ErrorMessage>}
            {success && <SuccessMessage>Scenario saved successfully!</SuccessMessage>}

            <ButtonRow>
              <Button onClick={handleClose} disabled={loading}>
                Cancel
              </Button>
              <Button
                colour={ButtonColour.Success}
                onClick={handleSave}
                disabled={loading || !title.trim()}
              >
                {loading ? 'Saving...' : 'Save'}
              </Button>
            </ButtonRow>
          </ModalCard>
        </Overlay>
      )}
    </AnimatePresence>
  );
};

export default SaveScenarioModal;
