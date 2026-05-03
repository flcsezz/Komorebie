import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';
import { DECK_COLORS, DECK_EMOJIS } from '../../lib/flashcards';

interface CreateDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (deck: { title: string; description: string; emoji: string; color: string }) => void;
  loading?: boolean;
}

const CreateDeckModal: React.FC<CreateDeckModalProps> = ({ isOpen, onClose, onSubmit, loading }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('📚');
  const [selectedColor, setSelectedColor] = useState('sage');
  const [showAllEmojis, setShowAllEmojis] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({ title: title.trim(), description: description.trim(), emoji: selectedEmoji, color: selectedColor });
    setTitle('');
    setDescription('');
    setSelectedEmoji('📚');
    setSelectedColor('sage');
  };

  const activeColor = DECK_COLORS.find(c => c.id === selectedColor) || DECK_COLORS[0];

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
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg overflow-hidden"
          >
            {/* Glow effect */}
            <div 
              className="absolute -inset-[1px] rounded-3xl opacity-60 blur-sm"
              style={{ background: `linear-gradient(135deg, ${activeColor.border}, transparent 60%)` }}
            />
            
            <div className="relative glass rounded-3xl border border-white/10 overflow-hidden">
              {/* Header */}
              <div className="px-8 pt-8 pb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-colors duration-300"
                    style={{ background: activeColor.bg, border: `1px solid ${activeColor.border}` }}
                  >
                    {selectedEmoji}
                  </div>
                  <div>
                    <h2 className="text-xl font-display font-light text-white tracking-tight">
                      Create New Deck
                    </h2>
                    <p className="text-[11px] text-white/30 mt-0.5">Build your knowledge, one card at a time</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl text-white/30 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-6">
                {/* Title */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold">
                    Deck Name
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Biology Chapter 5"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-sage-200/30 transition-colors"
                    autoFocus
                    maxLength={60}
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold">
                    Description <span className="text-white/15">(optional)</span>
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What is this deck about?"
                    rows={2}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-sage-200/30 transition-colors resize-none"
                    maxLength={200}
                  />
                </div>

                {/* Emoji Picker */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold">
                    Icon
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(showAllEmojis ? DECK_EMOJIS : DECK_EMOJIS.slice(0, 8)).map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setSelectedEmoji(emoji)}
                        className={`w-10 h-10 rounded-xl text-lg flex items-center justify-center transition-all duration-200 cursor-pointer ${
                          selectedEmoji === emoji 
                            ? 'bg-white/15 border-white/30 scale-110 shadow-lg' 
                            : 'bg-white/5 border-white/5 hover:bg-white/10 hover:scale-105'
                        } border`}
                      >
                        {emoji}
                      </button>
                    ))}
                    {!showAllEmojis && (
                      <button
                        type="button"
                        onClick={() => setShowAllEmojis(true)}
                        className="w-10 h-10 rounded-xl text-[10px] text-white/30 bg-white/5 border border-white/5 hover:bg-white/10 flex items-center justify-center cursor-pointer transition-colors"
                      >
                        +{DECK_EMOJIS.length - 8}
                      </button>
                    )}
                  </div>
                </div>

                {/* Color Picker */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold">
                    Color Theme
                  </label>
                  <div className="flex gap-3">
                    {DECK_COLORS.map((color) => (
                      <button
                        key={color.id}
                        type="button"
                        onClick={() => setSelectedColor(color.id)}
                        className={`group relative w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-200 ${
                          selectedColor === color.id ? 'scale-110 ring-2 ring-white/20' : 'hover:scale-105'
                        }`}
                        style={{ background: color.bg, border: `1px solid ${color.border}` }}
                        title={color.label}
                      >
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: color.text }}
                        />
                        {selectedColor === color.id && (
                          <motion.div 
                            layoutId="color-ring"
                            className="absolute -inset-1 rounded-xl border-2"
                            style={{ borderColor: color.text + '60' }}
                          />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-6 border-t border-white/5">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-white/20 uppercase tracking-widest font-bold">Next Step</span>
                    <span className="text-[11px] text-white/40">Add cards to your new deck</span>
                  </div>
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
                      disabled={!title.trim() || loading}
                      className="px-6 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-all duration-300 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      style={{ 
                        background: activeColor.bg, 
                        color: activeColor.text,
                        border: `1px solid ${activeColor.border}`,
                      }}
                    >
                      <Sparkles className="w-4 h-4" />
                      {loading ? 'Creating...' : 'Create Deck'}
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

export default CreateDeckModal;
