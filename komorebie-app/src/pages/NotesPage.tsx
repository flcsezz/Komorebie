import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Folder, 
  Star, 
  Trash2, 
  FileText, 
  MoreVertical,
  ChevronRight,
  BookOpen,
  Sparkles,
  Tag as TagIcon,
  Archive,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { useNotes } from '../hooks/useNotes';
import GlassCard from '../components/ui/GlassCard';
import PageTransition from '../components/ui/PageTransition';
import ZenLoader from '../components/ui/ZenLoader';
import { format } from 'date-fns';

const NotesPage: React.FC = () => {
  const { notes, loading, createNote, updateNote, deleteNote } = useNotes();
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFolder, setActiveFolder] = useState<string>('All');
  const [isZenMode, setIsZenMode] = useState(false);

  const folders = useMemo(() => {
    const f = new Set(['All', 'Favorites']);
    notes.forEach(n => f.add(n.folder));
    return Array.from(f);
  }, [notes]);

  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      const title = n.title || '';
      const content = n.content || '';
      const query = (searchQuery || '').toLowerCase();

      const matchesSearch = title.toLowerCase().includes(query) || 
                           content.toLowerCase().includes(query);
      const matchesFolder = activeFolder === 'All' || 
                           (activeFolder === 'Favorites' ? n.is_favorite : n.folder === activeFolder);
      return matchesSearch && matchesFolder;
    });
  }, [notes, searchQuery, activeFolder]);

  const selectedNote = useMemo(() => 
    notes.find(n => n.id === selectedNoteId) || null, 
    [notes, selectedNoteId]
  );

  const handleCreateNote = async () => {
    const newNote = await createNote({
      title: 'New Reflection',
      content: '',
      folder: activeFolder === 'All' || activeFolder === 'Favorites' ? 'General' : activeFolder
    });
    if (newNote) setSelectedNoteId(newNote.id);
  };

  return (
    <PageTransition>
      <div className="h-[calc(100vh-120px)] flex gap-6 px-6 pb-6 relative">
        {/* Sidebar: Folders & Navigation */}
        <AnimatePresence>
          {!isZenMode && (
            <motion.aside 
              initial={{ opacity: 0, x: -20, width: 0 }}
              animate={{ opacity: 1, x: 0, width: 256 }}
              exit={{ opacity: 0, x: -20, width: 0 }}
              className="flex flex-col gap-6 overflow-hidden"
            >
              <div className="flex items-center gap-3 px-2">
                <div className="w-8 h-8 rounded-xl bg-sage-200/10 flex items-center justify-center border border-sage-200/20">
                  <BookOpen className="w-4 h-4 text-sage-200" />
                </div>
                <h2 className="text-sm font-display font-medium tracking-tight text-white/90">Knowledge Grove</h2>
              </div>

              <GlassCard variant="icy" className="flex-1 p-4 flex flex-col gap-2 overflow-y-auto custom-scrollbar">
                <button 
                  onClick={handleCreateNote}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-sage-200 text-slate-950 rounded-xl text-xs font-bold uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] mb-4"
                >
                  <Plus className="w-4 h-4" />
                  New Note
                </button>

                <div className="space-y-1">
                  {folders.map(folder => (
                    <button
                      key={folder}
                      onClick={() => setActiveFolder(folder)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all ${
                        activeFolder === folder 
                          ? 'bg-white/10 text-white border border-white/10' 
                          : 'text-white/40 hover:text-white/60 hover:bg-white/5'
                      }`}
                    >
                      {folder === 'All' ? <FileText className="w-4 h-4" /> : 
                       folder === 'Favorites' ? <Star className="w-4 h-4" /> : 
                       <Folder className="w-4 h-4" />}
                      {folder}
                      {activeFolder === folder && (
                        <motion.div layoutId="active-folder" className="ml-auto w-1 h-1 rounded-full bg-sage-200" />
                      )}
                    </button>
                  ))}
                </div>

                <div className="mt-auto pt-4 border-t border-white/5 space-y-1">
                  <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-white/30 hover:text-white/50 hover:bg-white/5 transition-all">
                    <Archive className="w-4 h-4" />
                    Archive
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-white/30 hover:text-white/50 hover:bg-white/5 transition-all">
                    <Trash2 className="w-4 h-4" />
                    Trash
                  </button>
                </div>
              </GlassCard>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Note List */}
        <main className="flex-1 flex gap-6 overflow-hidden">
          <AnimatePresence>
            {!isZenMode && (
              <motion.div 
                initial={{ opacity: 0, x: -20, width: 0 }}
                animate={{ opacity: 1, x: 0, width: 320 }}
                exit={{ opacity: 0, x: -20, width: 0 }}
                className="flex flex-col gap-4 overflow-hidden"
              >
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-sage-200 transition-colors" />
                  <input 
                    type="text" 
                    placeholder="Search reflections..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-xs text-white placeholder-white/20 focus:outline-none focus:border-sage-200/40 transition-all focus:bg-white/[0.08]"
                  />
                </div>

                <GlassCard variant="icy" className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
                  {loading ? (
                    <div className="p-8 text-center"><ZenLoader /></div>
                  ) : filteredNotes.length === 0 ? (
                    <div className="p-12 text-center space-y-4">
                      <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/10 text-white/10">
                        <BookOpen className="w-6 h-6" />
                      </div>
                      <p className="text-xs text-white/20 uppercase tracking-widest font-bold">Nothing found</p>
                    </div>
                  ) : (
                    <div className="p-2 space-y-1">
                      {filteredNotes.map(note => (
                        <button
                          key={note.id}
                          onClick={() => setSelectedNoteId(note.id)}
                          className={`w-full text-left p-4 rounded-xl transition-all group ${
                            selectedNoteId === note.id 
                              ? 'bg-white/10 border border-white/10 shadow-lg' 
                              : 'hover:bg-white/5 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] uppercase tracking-widest font-bold text-white/20 group-hover:text-white/40 transition-colors">
                              {format(new Date(note.updated_at), 'MMM d, yyyy')}
                            </span>
                            {note.is_favorite && <Star className="w-3 h-3 text-amber-300/60" fill="currentColor" />}
                          </div>
                          <h4 className={`text-sm font-medium mb-2 truncate ${selectedNoteId === note.id ? 'text-white' : 'text-white/70'}`}>
                            {note.title || 'Untitled Reflection'}
                          </h4>
                          <p className="text-xs text-white/30 line-clamp-2 leading-relaxed">
                            {note.content || 'No content yet...'}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Editor Area */}
          <motion.div 
            layout
            className="flex-1"
          >
            <AnimatePresence mode="wait">
              {selectedNote ? (
                <motion.div
                  key={selectedNote.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="h-full"
                >
                  <GlassCard variant="frosted" className="h-full flex flex-col p-8 overflow-hidden relative">
                    {/* Editor Header */}
                    <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-6">
                      <div className="flex-1">
                        <input 
                          type="text"
                          value={selectedNote.title}
                          onChange={(e) => updateNote(selectedNote.id, { title: e.target.value })}
                          className="w-full bg-transparent border-none text-2xl font-display font-light text-white focus:outline-none placeholder:text-white/10"
                          placeholder="Note Title"
                        />
                        <div className="flex items-center gap-4 mt-2">
                          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[10px] text-white/40 uppercase tracking-widest font-bold">
                            <Folder className="w-3 h-3" />
                            {selectedNote.folder}
                          </div>
                          <span className="text-[10px] text-white/20 uppercase tracking-widest font-bold">
                            Last edited {format(new Date(selectedNote.updated_at), 'p')}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setIsZenMode(!isZenMode)}
                          className={`p-2.5 rounded-xl transition-all border ${
                            isZenMode 
                              ? 'bg-sage-200/10 border-sage-200/20 text-sage-200' 
                              : 'bg-white/5 border-white/10 text-white/40 hover:text-white/60'
                          }`}
                          title={isZenMode ? "Exit Zen Mode" : "Enter Zen Mode"}
                        >
                          {isZenMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                        </button>
                        <button 
                          onClick={() => updateNote(selectedNote.id, { is_favorite: !selectedNote.is_favorite })}
                          className={`p-2.5 rounded-xl transition-all border ${
                            selectedNote.is_favorite 
                              ? 'bg-amber-300/10 border-amber-300/20 text-amber-300' 
                              : 'bg-white/5 border-white/10 text-white/40 hover:text-white/60'
                          }`}
                        >
                          <Star className="w-4 h-4" fill={selectedNote.is_favorite ? "currentColor" : "none"} />
                        </button>
                        <button className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-white/60 transition-all">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => {
                            if (confirm('Move this reflection to the trash?')) {
                              deleteNote(selectedNote.id);
                              setSelectedNoteId(null);
                            }
                          }}
                          className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* AI Insights Bar (Placeholder for AI features) */}
                    {selectedNote.content.length > 100 && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mb-8 p-4 bg-sage-200/5 border border-sage-200/20 rounded-2xl flex items-center gap-4 group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-sage-200/20 flex items-center justify-center">
                          <Sparkles className="w-4 h-4 text-sage-200" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] text-sage-200 uppercase tracking-widest font-bold mb-1">AI Insight</p>
                          <p className="text-xs text-white/60 leading-relaxed italic">
                            "This note explores complex themes. Would you like to generate flashcards or a concise summary?"
                          </p>
                        </div>
                        <button className="px-4 py-2 bg-sage-200/10 hover:bg-sage-200/20 border border-sage-200/20 rounded-xl text-[10px] text-sage-200 uppercase tracking-widest font-bold transition-all">
                          Process
                        </button>
                      </motion.div>
                    )}

                    {/* Main Content Editor */}
                    <div className="flex-1 relative group">
                      {isZenMode && (
                        <div className="absolute inset-0 bg-sage-200/5 rounded-3xl blur-[100px] animate-breath opacity-20 pointer-events-none" />
                      )}
                      <textarea 
                        value={selectedNote.content}
                        onChange={(e) => updateNote(selectedNote.id, { content: e.target.value })}
                        className={`w-full h-full bg-transparent border-none text-white/80 leading-relaxed focus:outline-none resize-none custom-scrollbar placeholder:text-white/5 font-light transition-all duration-1000 ${
                          isZenMode ? 'text-2xl px-12 py-12' : 'text-lg'
                        }`}
                        placeholder="Start your reflection here..."
                      />
                    </div>

                    {/* Footer / Tags */}
                    <div className="mt-8 pt-6 border-t border-white/5 flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <TagIcon className="w-3.5 h-3.5 text-white/20" />
                        <div className="flex gap-2">
                          {selectedNote.tags.map(tag => (
                            <span key={tag} className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[9px] text-white/40 uppercase tracking-widest font-bold">
                              {tag}
                            </span>
                          ))}
                          <button className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/20 hover:text-white/60 transition-all">
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                  <div className="w-20 h-20 bg-white/5 rounded-3xl border border-white/10 flex items-center justify-center rotate-3">
                    <FileText className="w-10 h-10 text-white/10" />
                  </div>
                  <div>
                    <h3 className="text-xl font-display font-light text-white/40 mb-2">Select a reflection</h3>
                    <p className="text-xs text-white/20 uppercase tracking-[0.2em] font-bold">Or plant a new seed in the grove</p>
                  </div>
                  <button 
                    onClick={handleCreateNote}
                    className="flex items-center gap-2 text-sage-200 hover:text-sage-100 transition-colors text-xs font-bold uppercase tracking-widest"
                  >
                    Quick Start <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </AnimatePresence>
          </motion.div>
        </main>
      </div>
    </PageTransition>
  );
};

export default NotesPage;
