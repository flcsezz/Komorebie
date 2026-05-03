import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Plus, Play, Layers, Star, Clock, Settings,
  Trash2, Pencil, ChevronRight, Shuffle, RotateCcw, X,
  BookOpen, GripVertical
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  fetchCards, fetchDueCards, createCards, deleteCard, updateCard,
  reviewCard, startStudySession, endStudySession, updateDeck,
  getDeckColor, type FlashcardCard, type FlashcardDeck, type DifficultyRating,
} from '../lib/flashcards';
import { supabase } from '../lib/supabase';
import FlashcardFlip from '../components/flashcards/FlashcardFlip';
import DifficultyButtons from '../components/flashcards/DifficultyButtons';
import StudyComplete from '../components/flashcards/StudyComplete';
import AddCardsModal from '../components/flashcards/AddCardsModal';

type ViewMode = 'overview' | 'study' | 'complete';

const FlashcardDeckPage: React.FC = () => {
  const { deckId } = useParams<{ deckId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [deck, setDeck] = useState<FlashcardDeck | null>(null);
  const [cards, setCards] = useState<FlashcardCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('overview');

  // Study state
  const [studyCards, setStudyCards] = useState<FlashcardCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studySessionId, setStudySessionId] = useState<string | null>(null);
  const [studyStats, setStudyStats] = useState({ totalCards: 0, correctCards: 0 });
  const studyStartTime = useRef<number>(0);

  // Modals
  const [showAddCards, setShowAddCards] = useState(false);
  const [addingCards, setAddingCards] = useState(false);
  const [editingCard, setEditingCard] = useState<FlashcardCard | null>(null);
  const [editFront, setEditFront] = useState('');
  const [editBack, setEditBack] = useState('');

  // Deck editing
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState('');

  const color = getDeckColor(deck?.color || 'sage');

  const loadDeck = useCallback(async () => {
    if (!deckId) return;
    setLoading(true);
    try {
      console.log('Loading deck:', deckId);
      const { data, error } = await supabase
        .from('flashcard_decks').select('*').eq('id', deckId).single();
      
      if (error) {
        console.error('Supabase error loading deck:', error);
        throw error;
      }
      
      if (!data) {
        console.warn('No deck data returned for ID:', deckId);
        setDeck(null);
      } else {
        setDeck(data);
        const cardsData = await fetchCards(deckId);
        setCards(Array.isArray(cardsData) ? cardsData : []);
      }
    } catch (err) {
      console.error('Failed to load deck:', err);
      setDeck(null);
    } finally {
      setLoading(false);
    }
  }, [deckId]);

  useEffect(() => { loadDeck(); }, [loadDeck]);

  // ─── Study Flow ─────────────────────────────────────────────────
  const startStudy = async (mode: 'all' | 'due' | 'shuffle') => {
    if (!user || !deckId || !deck) return;
    let studySet: FlashcardCard[];
    if (mode === 'due') {
      studySet = await fetchDueCards(deckId);
      if (studySet.length === 0) studySet = [...cards];
    } else {
      studySet = [...cards];
    }
    if (mode === 'shuffle') {
      for (let i = studySet.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [studySet[i], studySet[j]] = [studySet[j], studySet[i]];
      }
    }
    if (studySet.length === 0) return;
    const session = await startStudySession(user.id, deckId);
    setStudySessionId(session.id);
    setStudyCards(studySet);
    setCurrentIndex(0);
    setIsFlipped(false);
    setStudyStats({ totalCards: 0, correctCards: 0 });
    studyStartTime.current = Date.now();
    setViewMode('study');
  };

  const handleRate = async (rating: DifficultyRating) => {
    const card = studyCards[currentIndex];
    if (!card) return;
    try {
      await reviewCard(card.id, rating, card);
      setStudyStats(prev => ({
        totalCards: prev.totalCards + 1,
        correctCards: prev.correctCards + (rating >= 3 ? 1 : 0),
      }));
      if (currentIndex < studyCards.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setIsFlipped(false);
      } else {
        finishStudy();
      }
    } catch (err) { console.error('Failed to rate card:', err); }
  };

  const finishStudy = async () => {
    if (studySessionId) {
      const duration = Math.round((Date.now() - studyStartTime.current) / 1000);
      await endStudySession(studySessionId, {
        cards_studied: studyStats.totalCards + 1,
        cards_correct: studyStats.correctCards,
        duration_seconds: duration,
      });
    }
    setViewMode('complete');
    loadDeck();
  };

  // ─── Card CRUD ──────────────────────────────────────────────────
  const handleAddCards = async (newCards: { front: string; back: string }[]) => {
    if (!user || !deckId) return;
    setAddingCards(true);
    try {
      await createCards(user.id, deckId, newCards);
      await loadDeck();
      setShowAddCards(false);
    } catch (err) { console.error('Failed to add cards:', err); }
    finally { setAddingCards(false); }
  };

  const handleDeleteCard = async (cardId: string) => {
    try {
      await deleteCard(cardId);
      setCards(prev => prev.filter(c => c.id !== cardId));
      if (deck) setDeck({ ...deck, card_count: deck.card_count - 1 });
    } catch (err) { console.error(err); }
  };

  const handleSaveEdit = async () => {
    if (!editingCard) return;
    try {
      const updated = await updateCard(editingCard.id, { front: editFront, back: editBack });
      setCards(prev => prev.map(c => c.id === updated.id ? updated : c));
      setEditingCard(null);
    } catch (err) { console.error(err); }
  };

  const handleSaveTitle = async () => {
    if (!deck || !editTitle.trim()) return;
    try {
      const updated = await updateDeck(deck.id, { title: editTitle.trim() });
      setDeck(updated);
      setIsEditingTitle(false);
    } catch (err) { console.error(err); }
  };

  if (loading) return (
    <div className="max-w-4xl mx-auto">
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-48 bg-white/5 rounded-xl" />
        <div className="h-64 bg-white/3 rounded-3xl" />
      </div>
    </div>
  );

  if (!deck) return (
    <div className="max-w-4xl mx-auto flex flex-col items-center justify-center py-32 text-center">
      <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
        <X className="w-10 h-10 text-white/20" />
      </div>
      <h2 className="text-2xl font-display font-light text-white mb-2">Deck Not Found</h2>
      <p className="text-sm text-white/20 mb-8 max-w-xs">The deck you're looking for might have been deleted or moved.</p>
      <button onClick={() => navigate('/app/flashcards')} 
        className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-white/60 hover:text-white transition-colors cursor-pointer flex items-center gap-2">
        <ArrowLeft className="w-4 h-4" /> Back to Library
      </button>
    </div>
  );

  // ─── Study View ─────────────────────────────────────────────────
  if (viewMode === 'study' && studyCards.length > 0) {
    const currentCard = studyCards[currentIndex];
    return (
      <div className="max-w-4xl mx-auto py-8">
        {/* Study Header */}
        <div className="flex items-center justify-between mb-12">
          <button onClick={() => { setViewMode('overview'); loadDeck(); }}
            className="flex items-center gap-2 text-sm text-white/30 hover:text-white transition-colors cursor-pointer">
            <X className="w-4 h-4" /> Exit
          </button>
          <div className="flex items-center gap-2">
            <span className="text-3xl">{deck.emoji}</span>
            <span className="text-sm font-display text-white/50">{deck.title}</span>
          </div>
          {/* Progress dots */}
          <div className="flex gap-1">
            {studyCards.slice(0, Math.min(studyCards.length, 20)).map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full transition-colors duration-300"
                style={{ backgroundColor: i < currentIndex ? color.text : i === currentIndex ? color.text + '80' : 'rgba(255,255,255,0.1)' }} />
            ))}
            {studyCards.length > 20 && <span className="text-[9px] text-white/15 ml-1">+{studyCards.length - 20}</span>}
          </div>
        </div>

        {/* Flashcard */}
        <FlashcardFlip
          front={currentCard.front} back={currentCard.back}
          isFlipped={isFlipped} onFlip={() => setIsFlipped(!isFlipped)}
          color={color} index={currentIndex} total={studyCards.length}
          onSwipeLeft={() => handleRate(0)} onSwipeRight={() => handleRate(3)}
        />

        {/* Difficulty Buttons */}
        <AnimatePresence>
          {isFlipped && <DifficultyButtons onRate={handleRate} visible={isFlipped} />}
        </AnimatePresence>

        {!isFlipped && (
          <div className="text-center mt-8">
            <p className="text-[11px] text-white/15">
              Click card to reveal · Swipe left/right to rate · or use keyboard (1-6)
            </p>
          </div>
        )}
      </div>
    );
  }

  // ─── Complete View ──────────────────────────────────────────────
  if (viewMode === 'complete') {
    const duration = Math.round((Date.now() - studyStartTime.current) / 1000);
    return (
      <div className="max-w-4xl mx-auto py-16">
        <StudyComplete
          stats={{ ...studyStats, totalCards: studyStats.totalCards + 1, durationSeconds: duration }}
          deckTitle={deck.title} deckEmoji={deck.emoji} color={color}
          onClose={() => setViewMode('overview')}
          onStudyAgain={() => startStudy('all')}
        />
      </div>
    );
  }

  // ─── Overview View ──────────────────────────────────────────────
  const safeCards = Array.isArray(cards) ? cards : [];
  const progress = (deck && deck.card_count > 0) ? (deck.mastered_count / deck.card_count) * 100 : 0;
  const dueCount = safeCards.filter(c => {
    try {
      return c.next_review_at && new Date(c.next_review_at) <= new Date();
    } catch (e) {
      return false;
    }
  }).length;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back Button */}
      <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        onClick={() => navigate('/app/flashcards')}
        className="flex items-center gap-2 text-sm text-white/30 hover:text-white transition-colors mb-8 cursor-pointer group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Library
      </motion.button>

      {/* Deck Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between mb-10">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
            style={{ background: color.bg, border: `1px solid ${color.border}`, boxShadow: `0 4px 30px ${color.glow}` }}>
            {deck.emoji}
          </div>
          <div>
            {isEditingTitle ? (
              <div className="flex items-center gap-2">
                <input value={editTitle} onChange={e => setEditTitle(e.target.value)} autoFocus
                  onKeyDown={e => { if (e.key === 'Enter') handleSaveTitle(); if (e.key === 'Escape') setIsEditingTitle(false); }}
                  className="text-2xl font-display font-light bg-transparent border-b border-white/20 focus:border-sage-200/40 outline-none text-white px-1" />
                <button onClick={handleSaveTitle} className="text-sage-200 text-xs cursor-pointer">Save</button>
              </div>
            ) : (
              <h1 className="text-2xl font-display font-light text-white tracking-tight group cursor-pointer"
                onClick={() => { setEditTitle(deck.title); setIsEditingTitle(true); }}>
                {deck.title}
                <Pencil className="w-3.5 h-3.5 inline-block ml-2 opacity-0 group-hover:opacity-40 transition-opacity" />
              </h1>
            )}
            {deck.description && <p className="text-sm text-white/25 mt-1">{deck.description}</p>}
            <div className="flex items-center gap-4 mt-2">
              <span className="text-[11px] text-white/30 flex items-center gap-1"><Layers className="w-3 h-3" /> {deck.card_count} cards</span>
              <span className="text-[11px] text-white/30 flex items-center gap-1"><Star className="w-3 h-3" /> {deck.mastered_count} mastered</span>
              {dueCount > 0 && <span className="text-[11px] flex items-center gap-1" style={{ color: color.text }}>
                <Clock className="w-3 h-3" /> {dueCount} due
              </span>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setShowAddCards(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer">
            <Plus className="w-4 h-4" /> Add Cards
          </button>
          {cards.length > 0 && (
            <button onClick={() => startStudy(dueCount > 0 ? 'due' : 'all')}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer"
              style={{ background: color.bg, color: color.text, border: `1px solid ${color.border}` }}>
              <Play className="w-4 h-4" /> {dueCount > 0 ? `Study ${dueCount} Due` : 'Study All'}
            </button>
          )}
        </div>
      </motion.div>

      {/* Progress Bar */}
      {deck.card_count > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
          <div className="flex justify-between mb-2">
            <span className="text-[10px] text-white/20 uppercase tracking-widest font-bold">Mastery Progress</span>
            <span className="text-[10px] font-mono" style={{ color: color.text }}>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 rounded-full bg-white/5 overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${Math.max(progress, 2)}%` }}
              transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${color.text}40, ${color.text})`, boxShadow: `0 0 12px ${color.glow}` }} />
          </div>
        </motion.div>
      )}

      {/* Study Mode Buttons */}
      {safeCards.length >= 2 && (
        <div className="flex gap-3 mb-8">
          {[
            { mode: 'all' as const, icon: BookOpen, label: 'All Cards', sub: `${safeCards.length} cards` },
            { mode: 'due' as const, icon: Clock, label: 'Due Cards', sub: `${dueCount} due` },
            { mode: 'shuffle' as const, icon: Shuffle, label: 'Shuffle', sub: 'Random order' },
          ].map(({ mode, icon: Icon, label, sub }) => (
            <button key={mode} onClick={() => startStudy(mode)}
              className="flex-1 flex items-center gap-3 p-4 rounded-2xl bg-white/3 border border-white/5 hover:bg-white/5 hover:border-white/10 transition-all cursor-pointer group text-left">
              <Icon className="w-5 h-5 text-white/20 group-hover:text-white/40 transition-colors" />
              <div>
                <div className="text-sm text-white/60 group-hover:text-white transition-colors">{label}</div>
                <div className="text-[10px] text-white/20">{sub}</div>
              </div>
              <ChevronRight className="w-4 h-4 ml-auto text-white/10 group-hover:text-white/30 transition-colors" />
            </button>
          ))}
        </div>
      )}

      {/* Cards List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[10px] uppercase tracking-[0.2em] text-white/20 font-bold">All Cards</h3>
          <span className="text-[10px] text-white/15">{safeCards.length} total</span>
        </div>

        {safeCards.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="py-20 text-center rounded-[2.5rem] border border-white/5 bg-white/[0.02] backdrop-blur-sm flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-6">
              <Layers className="w-8 h-8 text-white/10" />
            </div>
            <h3 className="text-lg font-display font-light text-white/60 mb-2">This Deck is Empty</h3>
            <p className="text-sm text-white/20 mb-10 max-w-xs leading-relaxed">
              Start building your knowledge base by adding your first set of flashcards.
            </p>
            <button onClick={() => setShowAddCards(true)}
              className="flex items-center gap-3 px-8 py-4 rounded-2xl text-sm font-medium bg-sage-200/15 text-sage-200 border border-sage-200/30 hover:bg-sage-200/25 transition-all duration-300 cursor-pointer group">
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
              Add Your First Cards
            </button>
          </motion.div>
        ) : (
          <AnimatePresence initial={false}>
            {safeCards.map((card, i) => (
              <motion.div key={card.id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ delay: i * 0.03 }}
                className="group flex items-center gap-5 p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all">
                <div className="flex flex-col items-center gap-1 opacity-20 group-hover:opacity-40 transition-opacity">
                  <GripVertical className="w-4 h-4" />
                  <span className="text-[9px] font-mono font-bold">{i + 1}</span>
                </div>
                <div className="flex-1 min-w-0 grid grid-cols-2 gap-8">
                  <div>
                    <div className="text-[9px] uppercase tracking-[0.2em] text-white/15 mb-2 font-bold">Front Content</div>
                    <p className="text-sm text-white/80 line-clamp-3 leading-relaxed">{card.front}</p>
                  </div>
                  <div className="border-l border-white/5 pl-8">
                    <div className="text-[9px] uppercase tracking-[0.2em] text-white/15 mb-2 font-bold">Back Content</div>
                    <p className="text-sm text-white/50 line-clamp-3 leading-relaxed italic">{card.back}</p>
                  </div>
                </div>
                {/* Difficulty indicator */}
                <div className="flex flex-col items-center gap-2 flex-shrink-0 px-2">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, j) => (
                      <div key={j} className="w-1 h-1 rounded-full"
                        style={{ backgroundColor: j < card.difficulty ? color.text : 'rgba(255,255,255,0.05)' }} />
                    ))}
                  </div>
                  <span className="text-[8px] uppercase tracking-widest text-white/10 font-bold">Level {card.difficulty}</span>
                </div>
                {/* Actions */}
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button onClick={() => { setEditingCard(card); setEditFront(card.front); setEditBack(card.back); }}
                    className="p-2 rounded-xl text-white/20 hover:text-white hover:bg-white/5 transition-colors cursor-pointer">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDeleteCard(card.id)}
                    className="p-2 rounded-xl text-white/20 hover:text-red-400 hover:bg-red-400/5 transition-colors cursor-pointer">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Add Cards Modal */}
      <AddCardsModal isOpen={showAddCards} onClose={() => setShowAddCards(false)}
        onSubmit={handleAddCards} deckTitle={deck.title} loading={addingCards} />

      {/* Edit Card Modal */}
      <AnimatePresence>
        {editingCard && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={() => setEditingCard(null)}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()} className="relative w-full max-w-md glass rounded-3xl border border-white/10 p-8">
              <h3 className="text-lg font-display font-light text-white mb-6">Edit Card</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold">Front</label>
                  <textarea value={editFront} onChange={e => setEditFront(e.target.value)} rows={3}
                    className="w-full mt-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-sage-200/30 resize-none" />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold">Back</label>
                  <textarea value={editBack} onChange={e => setEditBack(e.target.value)} rows={3}
                    className="w-full mt-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-sage-200/30 resize-none" />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setEditingCard(null)} className="px-4 py-2 text-sm text-white/40 cursor-pointer">Cancel</button>
                <button onClick={handleSaveEdit}
                  className="px-5 py-2 rounded-xl text-sm bg-sage-200/15 text-sage-200 border border-sage-200/30 cursor-pointer">Save</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FlashcardDeckPage;
