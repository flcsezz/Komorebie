import GlassCard from '../components/ui/GlassCard';

export const PlaceholderPage: React.FC<{ title: string, description: string }> = ({ title, description }) => (
  <div className="max-w-4xl mx-auto pt-12">
    <GlassCard variant="frosted" className="p-12 text-center flex flex-col items-center gap-6">
      <div className="w-16 h-16 rounded-full bg-sage-200/10 flex items-center justify-center border border-sage-200/20">
        <div className="w-2 h-2 rounded-full bg-sage-200 animate-pulse" />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-display font-light tracking-tight text-white">{title}</h1>
        <p className="text-sm text-white/40 max-w-md mx-auto">{description}</p>
      </div>
      <div className="px-6 py-2 bg-white/5 border border-white/10 rounded-full text-[10px] uppercase tracking-widest text-white/20 font-bold">
        Phase 1: Backbone Under Construction
      </div>
    </GlassCard>
  </div>
);

export const TasksPage = () => <PlaceholderPage title="Task Sanctuary" description="Define what you're working on now, next, and later. Your focused task library is coming soon." />;
export const NotesPage = () => <PlaceholderPage title="Knowledge Grove" description="Upload, write, and refine your study notes. AI-powered summaries and flashcards will sprout here." />;
export const RoomPage = () => <PlaceholderPage title="Zen Room" description="Customize your atmosphere, soundscapes, and companion progression in this restorative space." />;
export const SocialPage = () => <PlaceholderPage title="Ambient Presence" description="Connect with fellow focusers through quiet presence and shared rhythm." />;
