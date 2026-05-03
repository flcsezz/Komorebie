import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Layers, BookOpen, Sparkles, MoreHorizontal,
  Trash2, Pencil, Lock, Brain,
  Clock, ChevronRight, Star
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  fetchDecks, createDeck, deleteDeck,
  getDeckColor, type FlashcardDeck,
} from '../lib/flashcards';
import CreateDeckModal from '../components/flashcards/CreateDeckModal';

// ─── Animated SVG Patterns ────────────────────────────────────────────

const FloatingParticle: React.FC<{ delay: number; x: number; size: number; color: string }> = ({ delay, x, size, color }) => (
  <motion.circle
    cx={x}
    r={size}
    fill={color}
    initial={{ cy: 300, opacity: 0 }}
    animate={{ cy: -20, opacity: [0, 0.6, 0] }}
    transition={{ duration: 8, delay, repeat: Infinity, ease: 'easeOut' }}
  />
);

const BackgroundDecoration: React.FC = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
    <svg className="absolute top-0 right-0 w-96 h-96" viewBox="0 0 300 300">
      {/* Zen circles */}
      <circle cx="250" cy="50" r="120" fill="none" stroke="rgba(183,201,176,0.08)" strokeWidth="0.5" />
      <circle cx="250" cy="50" r="80" fill="none" stroke="rgba(183,201,176,0.06)" strokeWidth="0.5" />
      <circle cx="250" cy="50" r="40" fill="none" stroke="rgba(183,201,176,0.04)" strokeWidth="0.5" />
      {/* Floating particles */}
      <FloatingParticle delay={0} x={220} size={1.5} color="rgba(183,201,176,0.3)" />
      <FloatingParticle delay={2} x={260} size={1} color="rgba(99,102,241,0.2)" />
      <FloatingParticle delay={4} x={240} size={1.2} color="rgba(251,191,36,0.2)" />
      <FloatingParticle delay={1} x={200} size={0.8} color="rgba(183,201,176,0.2)" />
      <FloatingParticle delay={3} x={280} size={1.3} color="rgba(167,139,250,0.15)" />
    </svg>
  </div>
);

// ─── Deck Card ────────────────────────────────────────────────────────

interface DeckCardProps {
  deck: FlashcardDeck;
  index: number;
  onOpen: () => void;
  onDelete: () => void;
}

const DeckCard: React.FC<DeckCardProps> = ({ deck, index, onOpen, onDelete }) => {
  const [showMenu, setShowMenu] = useState(false);
  const color = getDeckColor(deck.color);
  const progress = deck.card_count > 0 ? (deck.mastered_count / deck.card_count) * 100 : 0;
  
  const [now] = useState(() => Date.now());
  
  const lastStudied = deck.last_studied_at
    ? new Date(deck.last_studied_at)
    : null;
  
  const getTimeAgo = (date: Date, currentNow: number) => {
    const diff = currentNow - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.06, type: 'spring', stiffness: 200, damping: 25 }}
      whileHover={{ y: -4 }}
      className="group relative"
    >
      {/* Glow effect on hover */}
      <div 
        className="absolute -inset-[1px] rounded-3xl opacity-0 group-hover:opacity-40 transition-opacity duration-500 blur-sm"
        style={{ background: `linear-gradient(135deg, ${color.glow}, transparent 60%)` }}
      />
      
      <div
        onClick={onOpen}
        className="relative rounded-[2rem] p-8 cursor-pointer transition-all duration-500 overflow-hidden flex flex-col justify-between min-h-[220px]"
        style={{
          background: 'rgba(18,18,18,0.4)',
          border: `1px solid rgba(255,255,255,0.08)`,
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Subtle top accent line */}
        <div 
          className="absolute top-0 left-0 right-0 h-[1px] opacity-60"
          style={{ background: `linear-gradient(90deg, transparent, ${color.text}40, transparent)` }}
        />

        <div>
          {/* Header Row */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div 
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3"
                style={{ 
                  background: color.bg, 
                  border: `1px solid ${color.border}`,
                  boxShadow: `0 8px 30px ${color.glow}`,
                }}
              >
                {deck.emoji}
              </div>
              <div>
                <h3 className="text-lg font-display font-medium text-white/90 group-hover:text-white transition-colors line-clamp-1">
                  {deck.title}
                </h3>
                {deck.description && (
                  <p className="text-[11px] text-white/25 line-clamp-1 mt-0.5 max-w-[200px]">
                    {deck.description}
                  </p>
                )}
              </div>
            </div>

            {/* Actions Menu */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className="p-2 rounded-xl text-white/10 hover:text-white/50 hover:bg-white/5 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>
              
              <AnimatePresence>
                {showMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: -5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -5 }}
                    className="absolute top-10 right-0 w-40 bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden z-50 shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => { onOpen(); setShowMenu(false); }}
                      className="w-full flex items-center gap-2 px-4 py-3 text-[11px] text-white/50 hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
                    >
                      <Pencil className="w-4 h-4" />
                      Edit Deck
                    </button>
                    <button
                      onClick={() => { onDelete(); setShowMenu(false); }}
                      className="w-full flex items-center gap-2 px-4 py-3 text-[11px] text-red-400/60 hover:bg-red-400/5 hover:text-red-400 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Deck
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex items-center gap-5 mb-6">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-white/15" />
              <span className="text-[11px] text-white/30 tracking-tight">{deck.card_count} cards</span>
            </div>
            {deck.mastered_count > 0 && (
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4" style={{ color: color.text + '60' }} />
                <span className="text-[11px] text-white/30 tracking-tight">{deck.mastered_count} mastered</span>
              </div>
            )}
            {lastStudied && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-white/15" />
                <span className="text-[11px] text-white/30 tracking-tight">{getTimeAgo(lastStudied, now)}</span>
              </div>
            )}
          </div>
        </div>

        <div>
          {/* Progress Bar */}
          <div className="h-1.5 rounded-full bg-white/5 overflow-hidden mb-3">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(progress, deck.card_count > 0 ? 3 : 0)}%` }}
              transition={{ delay: index * 0.06 + 0.3, duration: 1, ease: [0.23, 1, 0.32, 1] }}
              className="h-full rounded-full"
              style={{ 
                background: `linear-gradient(90deg, ${color.text}40, ${color.text})`,
                boxShadow: `0 0 10px ${color.glow}`,
              }}
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-white/15 font-mono tracking-wider uppercase">
              {progress > 0 ? `${Math.round(progress)}% Mastery` : 'Initial Phase'}
            </span>
            <motion.div 
              className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0"
              style={{ color: color.text }}
            >
              Start Session <ChevronRight className="w-3 h-3" />
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ─── Locked AI Deck Card (Small/Floating) ──────────────────────────

const LockedDeckCard: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: 0.8, type: 'spring' }}
    className="fixed bottom-8 right-8 z-40 w-64 group"
  >
    <div className="relative rounded-2xl p-4 overflow-hidden shadow-2xl"
      style={{
        background: 'rgba(18,18,18,0.7)',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* Glow */}
      <div className="absolute -inset-1 bg-amber-500/5 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="relative flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 border border-white/10 flex-shrink-0">
          <Brain className="w-5 h-5 text-white/20" />
          <div className="absolute -top-1 -right-1">
            <Lock className="w-2.5 h-2.5 text-white/30" />
          </div>
        </div>
        <div className="min-w-0">
          <h3 className="text-[11px] font-bold text-white/40 uppercase tracking-widest truncate">
            AI-Generated Decks
          </h3>
          <p className="text-[9px] text-white/15 truncate mt-0.5">
            Coming in next update
          </p>
        </div>
        <div className="ml-auto opacity-20 group-hover:opacity-50 transition-opacity">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
        </div>
      </div>
    </div>
  </motion.div>
);

// ─── Empty State ──────────────────────────────────────────────────────

const EmptyState: React.FC<{ onCreateDeck: () => void }> = ({ onCreateDeck }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.2 }}
    className="col-span-full flex flex-col items-center justify-center py-24 px-10 rounded-[3rem] border border-white/10 bg-white/[0.03] backdrop-blur-2xl relative overflow-hidden shadow-2xl"
  >
    {/* Ambient background glow */}
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-sage-200/5 blur-[100px] pointer-events-none" />
    <div className="relative mb-10">
      {/* Ambient glow */}
      <div className="absolute inset-0 bg-sage-200/10 blur-[60px] rounded-full scale-150 opacity-50" />
      
      {/* Animated SVG illustration */}
      <svg width="140" height="140" viewBox="0 0 120 120" fill="none" className="relative">
        {/* Card stack */}
        <motion.rect
          x="25" y="35" width="70" height="50" rx="10"
          fill="rgba(183,201,176,0.05)"
          stroke="rgba(183,201,176,0.15)"
          strokeWidth="1"
          initial={{ rotate: -8, y: 35 }}
          animate={{ rotate: [-8, -6, -8] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.rect
          x="30" y="30" width="70" height="50" rx="10"
          fill="rgba(183,201,176,0.08)"
          stroke="rgba(183,201,176,0.2)"
          strokeWidth="1"
          initial={{ rotate: -3, y: 30 }}
          animate={{ rotate: [-3, -1, -3] }}
          transition={{ duration: 4, delay: 0.2, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.rect
          x="35" y="25" width="70" height="50" rx="10"
          fill="rgba(18,18,18,0.9)"
          stroke="rgba(183,201,176,0.4)"
          strokeWidth="2"
          animate={{ y: [25, 20, 25] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Lines on top card */}
        <motion.line
          x1="45" y1="42" x2="85" y2="42"
          stroke="rgba(183,201,176,0.15)"
          strokeWidth="2"
          strokeLinecap="round"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        <motion.line
          x1="45" y1="50" x2="75" y2="50"
          stroke="rgba(183,201,176,0.1)"
          strokeWidth="2"
          strokeLinecap="round"
          animate={{ opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 3, delay: 0.3, repeat: Infinity }}
        />
      </svg>
    </div>
    
    <h3 className="text-xl font-display font-light text-white mb-3">
      Your Library is Empty
    </h3>
    <p className="text-sm text-white/30 mb-10 text-center max-w-sm leading-relaxed">
      Komorebie helps you retain knowledge through the power of focus and spaced repetition. Start by creating a deck for your current studies.
    </p>
    <button
      onClick={onCreateDeck}
      className="flex items-center gap-3 px-8 py-4 rounded-2xl text-sm font-medium bg-sage-200/15 text-sage-200 border border-sage-200/30 hover:bg-sage-200/25 transition-all duration-300 cursor-pointer group"
    >
      <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
      Create Your First Deck
    </button>
  </motion.div>
);

// ─── Main Page ────────────────────────────────────────────────────────

const FlashcardLibrary: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [loading, setLoading] = useState(true);
  const [createLoading, setCreateLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const loadDecks = useCallback(async () => {
    if (!user) return;
    try {
      const data = await fetchDecks(user.id);
      setDecks(data);
    } catch (err) {
      console.error('Failed to fetch decks:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const init = async () => { await loadDecks(); };
    init();
  }, [loadDecks]);

  const handleCreateDeck = async (deck: { title: string; description: string; emoji: string; color: string }) => {
    if (!user) return;
    setCreateLoading(true);
    try {
      const newDeck = await createDeck(user.id, deck);
      setDecks(prev => [newDeck, ...prev]);
      setShowCreateModal(false);
      // Navigate to the new deck immediately so they can add cards
      navigate(`/app/flashcards/${newDeck.id}`);
    } catch (err) {
      console.error('Failed to create deck:', err);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteDeck = async (deckId: string) => {
    try {
      await deleteDeck(deckId);
      setDecks(prev => prev.filter(d => d.id !== deckId));
    } catch (err) {
      console.error('Failed to delete deck:', err);
    }
  };

  // Total stats
  const totalCards = decks.reduce((sum, d) => sum + d.card_count, 0);
  const totalMastered = decks.reduce((sum, d) => sum + d.mastered_count, 0);

  return (
    <div className="max-w-6xl mx-auto relative">
      <BackgroundDecoration />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-sage-200/10 border border-sage-200/20 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-sage-200" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-light tracking-tight text-white">
                  Flashcards
                </h1>
                <p className="text-[11px] text-white/25 mt-0.5">
                  Master your knowledge with spaced repetition
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick stats */}
            {totalCards > 0 && (
              <div className="flex items-center gap-4 mr-4">
                <div className="text-center">
                  <div className="text-lg font-display font-bold text-white">{totalCards}</div>
                  <div className="text-[9px] uppercase tracking-widest text-white/20">Cards</div>
                </div>
                <div className="w-px h-8 bg-white/5" />
                <div className="text-center">
                  <div className="text-lg font-display font-bold text-sage-200">{totalMastered}</div>
                  <div className="text-[9px] uppercase tracking-widest text-white/20">Mastered</div>
                </div>
                <div className="w-px h-8 bg-white/5" />
                <div className="text-center">
                  <div className="text-lg font-display font-bold text-white">{decks.length}</div>
                  <div className="text-[9px] uppercase tracking-widest text-white/20">Decks</div>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-medium bg-sage-200/15 text-sage-200 border border-sage-200/30 hover:bg-sage-200/25 transition-all cursor-pointer group"
            >
              <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
              New Deck
            </button>
          </div>
        </div>
      </motion.div>

      {/* Decks Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="rounded-3xl p-6 animate-pulse"
              style={{ background: 'rgba(18,18,18,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-white/5" />
                <div className="space-y-2">
                  <div className="w-24 h-4 bg-white/5 rounded" />
                  <div className="w-16 h-3 bg-white/3 rounded" />
                </div>
              </div>
              <div className="h-1 bg-white/3 rounded-full" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {decks.map((deck, i) => (
              <DeckCard
                key={deck.id}
                deck={deck}
                index={i}
                onOpen={() => navigate(`/app/flashcards/${deck.id}`)}
                onDelete={() => handleDeleteDeck(deck.id)}
              />
            ))}
          </AnimatePresence>

          {/* Empty state if no decks */}
          {decks.length === 0 && <EmptyState onCreateDeck={() => setShowCreateModal(true)} />}
        </div>
      )}

      {/* Locked AI Deck - floating corner */}
      <LockedDeckCard />

      {/* Create Deck Modal */}
      <CreateDeckModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateDeck}
        loading={createLoading}
      />
    </div>
  );
};

export default FlashcardLibrary;
