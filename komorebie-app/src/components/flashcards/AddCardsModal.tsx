import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, ArrowRight, GripVertical } from 'lucide-react';

interface CardData {
  front: string;
  back: string;
  id: string;
}

interface AddCardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (cards: { front: string; back: string }[]) => void;
  deckTitle: string;
  loading?: boolean;
}

const generateId = () => {
  try {
    return crypto.randomUUID();
  } catch (e) {
    return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
  }
};

const AddCardsModal: React.FC<AddCardsModalProps> = ({ isOpen, onClose, onSubmit, deckTitle, loading }) => {
  const [cards, setCards] = useState<CardData[]>([
    { id: generateId(), front: '', back: '' },
  ]);

  const addCard = () => {
    setCards(prev => [...prev, { id: generateId(), front: '', back: '' }]);
  };

  const removeCard = (id: string) => {
    if (cards.length <= 1) return;
    setCards(prev => prev.filter(c => c.id !== id));
  };

  const updateCard = (id: string, field: 'front' | 'back', value: string) => {
    setCards(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validCards = cards.filter(c => c.front.trim() && c.back.trim());
    if (validCards.length === 0) return;
    onSubmit(validCards.map(c => ({ front: c.front.trim(), back: c.back.trim() })));
    setCards([{ id: generateId(), front: '', back: '' }]);
  };

  const validCount = cards.filter(c => c.front.trim() && c.back.trim()).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl max-h-[85vh] flex flex-col"
          >
            <div className="relative glass rounded-3xl border border-white/10 overflow-hidden flex flex-col max-h-[85vh]">
              {/* Header */}
              <div className="px-8 pt-8 pb-4 flex items-start justify-between flex-shrink-0">
                <div>
                  <h2 className="text-xl font-display font-light text-white tracking-tight">
                    Add Cards
                  </h2>
                  <p className="text-[11px] text-white/30 mt-0.5">
                    Adding to <span className="text-white/50">{deckTitle}</span>
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl text-white/30 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Cards List */}
              <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                <div className="flex-1 overflow-y-auto px-8 pb-4 custom-scrollbar space-y-3">
                  <AnimatePresence initial={false}>
                    {cards.map((card, index) => (
                      <motion.div
                        key={card.id}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="group"
                      >
                        <div className="flex items-stretch gap-3 p-4 bg-white/3 border border-white/5 rounded-2xl hover:border-white/10 transition-colors">
                          {/* Card Number */}
                          <div className="flex flex-col items-center justify-center gap-1 text-white/15 flex-shrink-0">
                            <GripVertical className="w-4 h-4" />
                            <span className="text-[10px] font-mono font-bold">{index + 1}</span>
                          </div>

                          {/* Front */}
                          <div className="flex-1 space-y-1">
                            <label className="text-[9px] uppercase tracking-[0.2em] text-white/20 font-bold">
                              Front
                            </label>
                            <textarea
                              value={card.front}
                              onChange={(e) => updateCard(card.id, 'front', e.target.value)}
                              placeholder="Question or term..."
                              rows={2}
                              className="w-full px-3 py-2 bg-white/5 border border-white/5 rounded-lg text-sm text-white placeholder:text-white/15 focus:outline-none focus:border-sage-200/30 transition-colors resize-none"
                            />
                          </div>

                          {/* Arrow */}
                          <div className="flex items-center text-white/10 flex-shrink-0">
                            <ArrowRight className="w-4 h-4" />
                          </div>

                          {/* Back */}
                          <div className="flex-1 space-y-1">
                            <label className="text-[9px] uppercase tracking-[0.2em] text-white/20 font-bold">
                              Back
                            </label>
                            <textarea
                              value={card.back}
                              onChange={(e) => updateCard(card.id, 'back', e.target.value)}
                              placeholder="Answer or definition..."
                              rows={2}
                              className="w-full px-3 py-2 bg-white/5 border border-white/5 rounded-lg text-sm text-white placeholder:text-white/15 focus:outline-none focus:border-sage-200/30 transition-colors resize-none"
                            />
                          </div>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => removeCard(card.id)}
                            disabled={cards.length <= 1}
                            className="flex-shrink-0 p-2 self-center text-white/10 hover:text-red-400/60 disabled:opacity-0 transition-colors cursor-pointer disabled:cursor-default"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {/* Add Card Button */}
                  <button
                    type="button"
                    onClick={addCard}
                    className="w-full py-3 border border-dashed border-white/10 rounded-2xl text-sm text-white/20 hover:text-white/40 hover:border-white/20 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Add Another Card
                  </button>
                </div>

                {/* Footer */}
                <div className="px-8 py-6 border-t border-white/5 flex items-center justify-between flex-shrink-0">
                  <span className="text-[11px] text-white/20">
                    {validCount} valid card{validCount !== 1 ? 's' : ''}
                  </span>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-6 py-2.5 text-sm text-white/40 hover:text-white transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={validCount === 0 || loading}
                      className="px-6 py-2.5 rounded-xl text-sm font-medium bg-sage-200/15 text-sage-200 border border-sage-200/30 hover:bg-sage-200/25 flex items-center gap-2 transition-all duration-300 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4" />
                      {loading ? 'Adding...' : `Add ${validCount} Card${validCount !== 1 ? 's' : ''}`}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddCardsModal;
