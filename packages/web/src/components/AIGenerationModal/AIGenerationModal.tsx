import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import styled from 'styled-components';
import Card from '../Card';
import Button, { ButtonColour } from '../Button/Button';
import { TextArea } from '../Input/Input';

interface AIGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (prompt: string, replaceMode: boolean) => Promise<void>;
  environment: string;
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

const ModalCard = styled(Card)`
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

const CheckboxWrapper = styled.div`
  display: flex;
  align-items: center;
  margin-top: var(--spacing-base);
  margin-bottom: var(--spacing-base);
`;

const Checkbox = styled.input`
  margin-right: var(--spacing-small);
  cursor: pointer;
`;

const Label = styled.label`
  cursor: pointer;
  user-select: none;
`;

const ButtonRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-small);
  margin-top: var(--spacing-base);
`;

const ErrorMessage = styled.div`
  color: var(--colour-error, #ff6b6b);
  margin-top: var(--spacing-small);
  font-size: 0.9rem;
`;

const AIGenerationModal = ({
  isOpen,
  onClose,
  onGenerate,
  environment,
}: AIGenerationModalProps) => {
  const [prompt, setPrompt] = useState('');
  const [replaceMode, setReplaceMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a scenario description');
      return;
    }

    setLoading(true);
    setError(undefined);

    try {
      await onGenerate(prompt, replaceMode);
      setPrompt('');
      setReplaceMode(false);
      onClose();
    } catch (err) {
      const error = err as Error;
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setPrompt('');
      setError(undefined);
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
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <ModalCard>
              <Title>AI Scenario Generation</Title>

              <TextArea
                label=""
                value={prompt}
                onChange={setPrompt}
                placeholder="Describe the test scenario you want to create... For example: 'Create a marketplace listing with 3 bids from different members'"
                disabled={loading}
              />

              <CheckboxWrapper>
                <Checkbox
                  type="checkbox"
                  id="replace-mode"
                  checked={replaceMode}
                  onChange={(e) => setReplaceMode(e.target.checked)}
                  disabled={loading}
                />
                <Label htmlFor="replace-mode">
                  Replace existing resources (clear all first)
                </Label>
              </CheckboxWrapper>

              {error && <ErrorMessage>{error}</ErrorMessage>}

              <ButtonRow>
                <Button onClick={handleClose} disabled={loading}>
                  Cancel
                </Button>
                <Button
                  colour={ButtonColour.Success}
                  onClick={handleGenerate}
                  disabled={loading || !prompt.trim()}
                >
                  {loading ? 'Generating...' : 'Generate'}
                </Button>
              </ButtonRow>
            </ModalCard>
          </motion.div>
        </Overlay>
      )}
    </AnimatePresence>
  );
};

export default AIGenerationModal;
