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
  } catch {
    return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
  }
};

const MAX_CHARS = 500;

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
    if (value.length > MAX_CHARS) return;
    setCards(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const incompleteCards = cards.some(c => !c.front.trim() || !c.back.trim());
    if (incompleteCards) {
      // In a real app we'd show a toast here, but for now we'll just prevent submit
      return;
    }
    onSubmit(cards.map(c => ({ front: c.front.trim(), back: c.back.trim() })));
    setCards([{ id: generateId(), front: '', back: '' }]);
  };

  const isAllValid = cards.every(c => c.front.trim() && c.back.trim());

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6"
          onClick={onClose}
        >
          <motion.div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            transition={{ type: 'spring', stiffness: 350, damping: 35 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl"
          >
            <div className="relative glass rounded-[2.5rem] border border-white/10 overflow-hidden flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="px-10 pt-10 pb-6 flex items-start justify-between flex-shrink-0 bg-white/[0.01]">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <Plus className="w-5 h-5 text-sage-200" />
                    <h2 className="text-2xl font-display font-light text-white tracking-tight">
                      Add New Flashcards
                    </h2>
                  </div>
                  <p className="text-sm text-white/30">
                    Expanding <span className="text-sage-200/60 font-medium">{deckTitle}</span>
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-3 rounded-2xl text-white/20 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Cards List */}
              <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                <div className="flex-1 overflow-y-auto px-10 pb-8 pt-2 custom-scrollbar space-y-6">
                  <AnimatePresence initial={false}>
                    {cards.map((card, index) => {
                      const isFrontEmpty = !card.front.trim();
                      const isBackEmpty = !card.back.trim();
                      
                      return (
                        <motion.div
                          key={card.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, scale: 0.95, height: 0, marginBottom: 0 }}
                          className="group relative"
                        >
                          <div className={`flex flex-col md:flex-row items-stretch gap-6 p-8 bg-white/[0.03] border rounded-[2rem] transition-all duration-300 ${
                            (!isFrontEmpty && !isBackEmpty) ? 'border-white/10' : 'border-white/5'
                          }`}>
                            {/* Card Header/Controls */}
                            <div className="flex md:flex-col items-center justify-between md:justify-center gap-4 flex-shrink-0 md:w-12 border-b md:border-b-0 md:border-r border-white/5 pb-4 md:pb-0 md:pr-4">
                              <div className="flex flex-col items-center gap-1">
                                <GripVertical className="w-5 h-5 text-white/10" />
                                <span className="text-xs font-mono font-bold text-white/20">{index + 1}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeCard(card.id)}
                                disabled={cards.length <= 1}
                                className="p-2.5 rounded-xl text-white/10 hover:text-red-400 hover:bg-red-400/10 disabled:opacity-0 transition-all cursor-pointer"
                                title="Remove card"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>

                            {/* Front Side */}
                            <div className="flex-1 space-y-3">
                              <div className="flex justify-between items-end">
                                <label className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold ml-1">
                                  Front Side
                                </label>
                                <span className={`text-[9px] font-mono ${card.front.length > MAX_CHARS * 0.8 ? 'text-amber-400' : 'text-white/10'}`}>
                                  {card.front.length}/{MAX_CHARS}
                                </span>
                              </div>
                              <div className="relative">
                                <textarea
                                  value={card.front}
                                  onChange={(e) => updateCard(card.id, 'front', e.target.value)}
                                  placeholder="What is the question or key term?"
                                  rows={5}
                                  className={`w-full px-5 py-4 bg-white/5 border rounded-2xl text-base text-white placeholder:text-white/10 focus:outline-none transition-all resize-none leading-relaxed ${
                                    isFrontEmpty ? 'border-white/5 focus:border-white/10' : 'border-sage-200/20 focus:border-sage-200/40'
                                  }`}
                                />
                                {isFrontEmpty && (
                                  <div className="absolute bottom-4 right-4 text-[9px] text-amber-500/40 font-bold uppercase tracking-widest pointer-events-none">
                                    Required
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Transition Arrow (Desktop) */}
                            <div className="hidden md:flex items-center text-white/5">
                              <ArrowRight className="w-6 h-6" />
                            </div>

                            {/* Back Side */}
                            <div className="flex-1 space-y-3">
                              <div className="flex justify-between items-end">
                                <label className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold ml-1">
                                  Back Side
                                </label>
                                <span className={`text-[9px] font-mono ${card.back.length > MAX_CHARS * 0.8 ? 'text-amber-400' : 'text-white/10'}`}>
                                  {card.back.length}/{MAX_CHARS}
                                </span>
                              </div>
                              <div className="relative">
                                <textarea
                                  value={card.back}
                                  onChange={(e) => updateCard(card.id, 'back', e.target.value)}
                                  placeholder="Provide the answer or explanation..."
                                  rows={5}
                                  className={`w-full px-5 py-4 bg-white/5 border rounded-2xl text-base text-white/80 placeholder:text-white/10 focus:outline-none transition-all resize-none leading-relaxed italic ${
                                    isBackEmpty ? 'border-white/5 focus:border-white/10' : 'border-white/10 focus:border-white/20'
                                  }`}
                                />
                                {isBackEmpty && (
                                  <div className="absolute bottom-4 right-4 text-[9px] text-amber-500/40 font-bold uppercase tracking-widest pointer-events-none">
                                    Required
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>

                  {/* Add Card Button */}
                  <motion.button
                    type="button"
                    onClick={addCard}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="w-full py-6 border-2 border-dashed border-white/5 rounded-[2rem] text-sm font-medium text-white/20 hover:text-sage-200 hover:border-sage-200/20 hover:bg-sage-200/5 flex items-center justify-center gap-3 transition-all cursor-pointer group"
                  >
                    <div className="p-2 rounded-xl bg-white/5 group-hover:bg-sage-200/10 transition-colors">
                      <Plus className="w-5 h-5" />
                    </div>
                    Add Another Card
                  </motion.button>
                </div>

                {/* Footer */}
                <div className="px-10 py-8 border-t border-white/10 bg-white/[0.01] flex items-center justify-between flex-shrink-0">
                  <div className="flex flex-col">
                    <span className="text-lg font-display font-medium text-white/80">
                      {cards.length} Card{cards.length !== 1 ? 's' : ''}
                    </span>
                    <span className={`text-[10px] uppercase tracking-widest font-bold ${isAllValid ? 'text-sage-200/60' : 'text-amber-500/40'}`}>
                      {isAllValid ? 'Ready to sync' : 'Fill all fields to continue'}
                    </span>
                  </div>
                  
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-8 py-3.5 text-sm font-medium text-white/40 hover:text-white transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!isAllValid || loading}
                      className="px-10 py-3.5 rounded-2xl text-sm font-bold bg-sage-200 text-stone-900 shadow-[0_10px_30px_rgba(183,201,176,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed disabled:grayscale disabled:scale-100"
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-stone-900/30 border-t-stone-900 rounded-full animate-spin" />
                          Processing...
                        </div>
                      ) : (
                        `Create ${cards.length} Card${cards.length !== 1 ? 's' : ''}`
                      )}
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
