import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Plus, Play, Layers, Star, Clock,
  Trash2, Pencil, ChevronRight, Shuffle, X,
  BookOpen
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
  const [studyStats, setStudyStats] = useState({ totalCards: 0, correctCards: 0, durationSeconds: 0 });
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

  useEffect(() => {
    const init = async () => { await loadDeck(); };
    init();
  }, [loadDeck]);

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
    setStudyStats({ totalCards: 0, correctCards: 0, durationSeconds: 0 });
    studyStartTime.current = Date.now();
    setViewMode('study');
  };

  const handleRate = async (rating: DifficultyRating) => {
    const card = studyCards[currentIndex];
    if (!card) return;
    try {
      await reviewCard(card.id, rating, card);
      setStudyStats(prev => ({
        ...prev,
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
    let duration = 0;
    if (studyStartTime.current > 0) {
      duration = Math.round((Date.now() - studyStartTime.current) / 1000);
    }
    
    if (studySessionId) {
      await endStudySession(studySessionId, {
        cards_studied: studyStats.totalCards + 1,
        cards_correct: studyStats.correctCards,
        duration_seconds: duration,
      });
    }
    
    setStudyStats(prev => ({
      ...prev,
      totalCards: prev.totalCards + 1,
      durationSeconds: duration
    }));
    
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
        <div className="flex items-center justify-between mb-16 px-4">
          <button onClick={() => { setViewMode('overview'); loadDeck(); }}
            className="flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-white/30 hover:text-white hover:bg-white/10 transition-all cursor-pointer group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] uppercase tracking-[0.2em] font-black">Back to Deck</span>
          </button>

          {/* Progress indicators */}
          <div className="flex items-center gap-4">
            <div className="flex gap-1.5">
              {studyCards.slice(0, Math.min(studyCards.length, 20)).map((_, i) => (
                <div key={i} className="w-2 h-2 rounded-full transition-all duration-500"
                  style={{ 
                    backgroundColor: i < currentIndex ? color.text : i === currentIndex ? color.text : 'rgba(255,255,255,0.05)',
                    boxShadow: i === currentIndex ? `0 0 10px ${color.glow}` : 'none',
                    transform: i === currentIndex ? 'scale(1.2)' : 'scale(1)'
                  }} />
              ))}
            </div>
            <span className="text-[11px] font-mono text-white/20 font-bold">
              {currentIndex + 1} <span className="text-white/5">/</span> {studyCards.length}
            </span>
          </div>
        </div>

        {/* Flashcard */}
        <FlashcardFlip
          front={currentCard.front} back={currentCard.back}
          isFlipped={isFlipped} onFlip={() => setIsFlipped(!isFlipped)}
          color={color}
          onSwipeLeft={() => handleRate(0)} onSwipeRight={() => handleRate(3)}
        />

        {/* Difficulty Buttons */}
        <AnimatePresence>
          {isFlipped && <DifficultyButtons onRate={handleRate} visible={isFlipped} />}
        </AnimatePresence>
      </div>
    );
  }

  // ─── Complete View ──────────────────────────────────────────────
  if (viewMode === 'complete') {
    return (
      <div className="max-w-4xl mx-auto py-16">
        <StudyComplete
          stats={studyStats}
          deckEmoji={deck.emoji} color={color}
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
    } catch {
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
        className="glass rounded-[2.5rem] p-8 border border-white/10 mb-10 relative overflow-hidden">
        {/* Subtle background glow based on deck color */}
        <div className="absolute top-0 right-0 w-64 h-64 blur-[100px] pointer-events-none opacity-20"
          style={{ background: color.text }} />

        <div className="relative flex items-start justify-between">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl shadow-2xl transition-transform duration-500 hover:scale-110 hover:rotate-3"
              style={{ background: color.bg, border: `1px solid ${color.border}`, boxShadow: `0 8px 32px ${color.glow}` }}>
              {deck.emoji}
            </div>
            <div>
              {isEditingTitle ? (
                <div className="flex items-center gap-2">
                  <input value={editTitle} onChange={e => setEditTitle(e.target.value)} autoFocus
                    onKeyDown={e => { if (e.key === 'Enter') handleSaveTitle(); if (e.key === 'Escape') setIsEditingTitle(false); }}
                    className="text-3xl font-display font-light bg-transparent border-b border-white/20 focus:border-sage-200/40 outline-none text-white px-1" />
                  <button onClick={handleSaveTitle} className="text-sage-200 text-xs cursor-pointer px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">Save</button>
                </div>
              ) : (
                <h1 className="text-3xl font-display font-light text-white tracking-tight group cursor-pointer flex items-center gap-3"
                  onClick={() => { setEditTitle(deck.title); setIsEditingTitle(true); }}>
                  {deck.title}
                  <Pencil className="w-4 h-4 opacity-0 group-hover:opacity-40 transition-opacity" />
                </h1>
              )}
              {deck.description && <p className="text-base text-white/40 mt-2 font-light max-w-lg">{deck.description}</p>}
              <div className="flex items-center gap-6 mt-4">
                <span className="text-[11px] uppercase tracking-widest text-white/30 flex items-center gap-2 font-bold"><Layers className="w-3.5 h-3.5" /> {deck.card_count} cards</span>
                <span className="text-[11px] uppercase tracking-widest text-white/30 flex items-center gap-2 font-bold"><Star className="w-3.5 h-3.5" /> {deck.mastered_count} mastered</span>
                {dueCount > 0 && <span className="text-[11px] uppercase tracking-widest flex items-center gap-2 font-bold" style={{ color: color.text }}>
                  <Clock className="w-3.5 h-3.5" /> {dueCount} due today
                </span>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => setShowAddCards(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-medium bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all cursor-pointer">
              <Plus className="w-4 h-4" /> Add Cards
            </button>
            {cards.length > 0 && (
              <button onClick={() => startStudy(dueCount > 0 ? 'due' : 'all')}
                className="flex items-center gap-2 px-8 py-3 rounded-2xl text-sm font-bold shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                style={{ background: color.bg, color: color.text, border: `1px solid ${color.border}`, boxShadow: `0 10px 20px ${color.glow}` }}>
                <Play className="w-4 h-4" /> {dueCount > 0 ? `Study ${dueCount} Due` : 'Study All'}
              </button>
            )}
          </div>
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

      {/* Cards Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] uppercase tracking-[0.2em] text-white/20 font-bold">All Cards</h3>
          <span className="text-[10px] text-white/15">{safeCards.length} total</span>
        </div>

        {safeCards.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="py-20 text-center rounded-[3rem] border border-white/10 bg-white/[0.03] backdrop-blur-2xl flex flex-col items-center relative overflow-hidden shadow-2xl">
            {/* Ambient background glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-sage-200/5 blur-[100px] pointer-events-none" />
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <AnimatePresence initial={false}>
              {safeCards.map((card, i) => (
                <motion.div key={card.id}
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.03 }}
                  className="group relative aspect-[2.5/3.5] flex flex-col p-5 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 hover:-translate-y-2 transition-all duration-500 overflow-hidden shadow-2xl shadow-black/20">
                  
                  {/* Card ID Indicator */}
                  <div className="absolute top-4 left-5 text-[9px] font-mono font-bold text-white/10 group-hover:text-white/30 transition-colors">
                    #{i + 1}
                  </div>

                  {/* Difficulty Corner Tag */}
                  <div className="absolute top-0 right-0 p-4 opacity-40 group-hover:opacity-100 transition-opacity">
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, j) => (
                        <div key={j} className="w-0.5 h-0.5 rounded-full"
                          style={{ backgroundColor: j < card.difficulty ? color.text : 'rgba(255,255,255,0.05)' }} />
                      ))}
                    </div>
                  </div>

                  {/* Actions (Absolute Hover) */}
                  <div className="absolute inset-0 flex items-center justify-center gap-2 bg-slate-950/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 z-10">
                    <button onClick={() => { setEditingCard(card); setEditFront(card.front); setEditBack(card.back); }}
                      className="p-2.5 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all hover:scale-110 shadow-lg cursor-pointer">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeleteCard(card.id)}
                      className="p-2.5 rounded-xl bg-red-500/20 text-red-300 hover:bg-red-500/40 transition-all hover:scale-110 shadow-lg cursor-pointer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="flex-1 flex flex-col gap-4 mt-3">
                    <div className="flex-1 min-h-0">
                      <div className="text-[7px] uppercase tracking-[0.25em] text-white/20 mb-2 font-black">Front</div>
                      <p className="text-sm text-white/90 leading-relaxed line-clamp-4 font-display font-light">{card.front}</p>
                    </div>
                    
                    <div className="h-px w-full bg-white/5" />
                    
                    <div className="flex-1 min-h-0">
                      <div className="text-[7px] uppercase tracking-[0.25em] text-white/20 mb-2 font-black">Back</div>
                      <p className="text-[12px] text-white/40 leading-relaxed italic line-clamp-4 font-light">{card.back}</p>
                    </div>
                  </div>

                  {/* Card-like aesthetic (Corner decoration) */}
                  <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-white/[0.01] rounded-full blur-2xl group-hover:bg-white/[0.03] transition-colors" />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
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
