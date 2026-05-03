import { supabase } from './supabase';

// ─── Types ────────────────────────────────────────────────────────────────

export interface FlashcardDeck {
  id: string;
  user_id: string;
  title: string;
  description: string;
  emoji: string;
  color: string;
  card_count: number;
  mastered_count: number;
  last_studied_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface FlashcardCard {
  id: string;
  deck_id: string;
  user_id: string;
  front: string;
  back: string;
  sort_order: number;
  difficulty: number;        // 0-5 scale
  interval_days: number;
  ease_factor: number;
  next_review_at: string;
  review_count: number;
  correct_count: number;
  last_reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudySession {
  id: string;
  user_id: string;
  deck_id: string;
  cards_studied: number;
  cards_correct: number;
  duration_seconds: number;
  started_at: string;
  ended_at: string | null;
}

export type DifficultyRating = 0 | 1 | 2 | 3 | 4 | 5;

// ─── SM-2 Spaced Repetition Algorithm ─────────────────────────────────

export function calculateNextReview(
  card: FlashcardCard,
  rating: DifficultyRating
): { interval_days: number; ease_factor: number; next_review_at: string } {
  let { ease_factor, interval_days } = card;

  // SM-2 algorithm
  if (rating < 3) {
    // Failed — reset interval
    interval_days = 0;
  } else {
    // Passed
    if (interval_days === 0) {
      interval_days = 1;
    } else if (interval_days === 1) {
      interval_days = 6;
    } else {
      interval_days = Math.round(interval_days * ease_factor);
    }
  }

  // Update ease factor
  ease_factor = Math.max(
    1.3,
    ease_factor + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02))
  );

  // Calculate next review date
  const next = new Date();
  next.setDate(next.getDate() + interval_days);

  return {
    interval_days,
    ease_factor: Math.round(ease_factor * 100) / 100,
    next_review_at: next.toISOString(),
  };
}

// ─── Deck Operations ──────────────────────────────────────────────────

export async function fetchDecks(userId: string): Promise<FlashcardDeck[]> {
  const { data, error } = await supabase
    .from('flashcard_decks')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createDeck(
  userId: string,
  deck: { title: string; description?: string; emoji?: string; color?: string }
): Promise<FlashcardDeck> {
  const { data, error } = await supabase
    .from('flashcard_decks')
    .insert({
      user_id: userId,
      title: deck.title,
      description: deck.description || '',
      emoji: deck.emoji || '📚',
      color: deck.color || 'sage',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateDeck(
  deckId: string,
  updates: Partial<Pick<FlashcardDeck, 'title' | 'description' | 'emoji' | 'color'>>
): Promise<FlashcardDeck> {
  const { data, error } = await supabase
    .from('flashcard_decks')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', deckId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteDeck(deckId: string): Promise<void> {
  const { error } = await supabase
    .from('flashcard_decks')
    .delete()
    .eq('id', deckId);

  if (error) throw error;
}

// ─── Card Operations ──────────────────────────────────────────────────

export async function fetchCards(deckId: string): Promise<FlashcardCard[]> {
  const { data, error } = await supabase
    .from('flashcard_cards')
    .select('*')
    .eq('deck_id', deckId)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function fetchDueCards(deckId: string): Promise<FlashcardCard[]> {
  const { data, error } = await supabase
    .from('flashcard_cards')
    .select('*')
    .eq('deck_id', deckId)
    .lte('next_review_at', new Date().toISOString())
    .order('next_review_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function createCard(
  userId: string,
  deckId: string,
  card: { front: string; back: string }
): Promise<FlashcardCard> {
  const { data, error } = await supabase
    .from('flashcard_cards')
    .insert({
      user_id: userId,
      deck_id: deckId,
      front: card.front,
      back: card.back,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function createCards(
  userId: string,
  deckId: string,
  cards: { front: string; back: string }[]
): Promise<FlashcardCard[]> {
  const rows = cards.map((c, i) => ({
    user_id: userId,
    deck_id: deckId,
    front: c.front,
    back: c.back,
    sort_order: i,
  }));

  const { data, error } = await supabase
    .from('flashcard_cards')
    .insert(rows)
    .select();

  if (error) throw error;
  return data || [];
}

export async function updateCard(
  cardId: string,
  updates: Partial<Pick<FlashcardCard, 'front' | 'back'>>
): Promise<FlashcardCard> {
  const { data, error } = await supabase
    .from('flashcard_cards')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', cardId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCard(cardId: string): Promise<void> {
  const { error } = await supabase
    .from('flashcard_cards')
    .delete()
    .eq('id', cardId);

  if (error) throw error;
}

export async function reviewCard(
  cardId: string,
  rating: DifficultyRating,
  card: FlashcardCard
): Promise<FlashcardCard> {
  const { interval_days, ease_factor, next_review_at } = calculateNextReview(card, rating);

  const { data, error } = await supabase
    .from('flashcard_cards')
    .update({
      difficulty: rating,
      interval_days,
      ease_factor,
      next_review_at,
      review_count: card.review_count + 1,
      correct_count: rating >= 3 ? card.correct_count + 1 : card.correct_count,
      last_reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', cardId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ─── Study Session Operations ─────────────────────────────────────────

export async function startStudySession(
  userId: string,
  deckId: string
): Promise<StudySession> {
  const { data, error } = await supabase
    .from('flashcard_study_sessions')
    .insert({
      user_id: userId,
      deck_id: deckId,
    })
    .select()
    .single();

  if (error) throw error;
  
  // Update last_studied_at on the deck
  await supabase
    .from('flashcard_decks')
    .update({ last_studied_at: new Date().toISOString() })
    .eq('id', deckId);

  return data;
}

export async function endStudySession(
  sessionId: string,
  stats: { cards_studied: number; cards_correct: number; duration_seconds: number }
): Promise<void> {
  const { error } = await supabase
    .from('flashcard_study_sessions')
    .update({
      ...stats,
      ended_at: new Date().toISOString(),
    })
    .eq('id', sessionId);

  if (error) throw error;
}

export async function fetchRecentStudySessions(
  userId: string,
  limit = 10
): Promise<StudySession[]> {
  const { data, error } = await supabase
    .from('flashcard_study_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

// ─── Deck Colors ──────────────────────────────────────────────────────

export const DECK_COLORS = [
  { id: 'sage', label: 'Sage', bg: 'rgba(183,201,176,0.15)', border: 'rgba(183,201,176,0.3)', text: '#B7C9B0', glow: 'rgba(183,201,176,0.2)' },
  { id: 'indigo', label: 'Indigo', bg: 'rgba(99,102,241,0.15)', border: 'rgba(99,102,241,0.3)', text: '#818CF8', glow: 'rgba(99,102,241,0.2)' },
  { id: 'amber', label: 'Amber', bg: 'rgba(251,191,36,0.15)', border: 'rgba(251,191,36,0.3)', text: '#FBBF24', glow: 'rgba(251,191,36,0.2)' },
  { id: 'rose', label: 'Rose', bg: 'rgba(244,114,182,0.15)', border: 'rgba(244,114,182,0.3)', text: '#F472B6', glow: 'rgba(244,114,182,0.2)' },
  { id: 'cyan', label: 'Cyan', bg: 'rgba(34,211,238,0.15)', border: 'rgba(34,211,238,0.3)', text: '#22D3EE', glow: 'rgba(34,211,238,0.2)' },
  { id: 'violet', label: 'Violet', bg: 'rgba(167,139,250,0.15)', border: 'rgba(167,139,250,0.3)', text: '#A78BFA', glow: 'rgba(167,139,250,0.2)' },
] as const;

export function getDeckColor(colorId: string) {
  return DECK_COLORS.find(c => c.id === colorId) || DECK_COLORS[0];
}

export const DECK_EMOJIS = [
  '📚', '🧠', '🎯', '💡', '🔬', '🧪', '📐', '🌿',
  '🎨', '🎵', '🌍', '💻', '📊', '🔮', '⚡', '🌸',
  '🏛️', '🧬', '📝', '🎓', '🌙', '☕', '🍃', '✨',
];
