import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../components/ui/GlassCard';
import SmoothScroll from '../components/layout/SmoothScroll';
import ScrollVideo from '../components/ui/ScrollVideo';
import { ArrowRight, Leaf, Sparkles, Zap } from 'lucide-react';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <SmoothScroll>
      <div className="relative min-h-screen">
        {/* Cinematic Scroll Video Background */}
        <div className="absolute inset-0 z-0">
          <ScrollVideo 
            src="https://player.vimeo.com/external/494252666.sd.mp4?s=7240c541703636f3322232924403328224729352&profile_id=165" 
          />
        </div>

        <div className="relative z-10">
          <section className="flex flex-col items-center justify-center min-h-screen text-center px-4 pt-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-4xl"
            >
              <h1 className="text-6xl md:text-8xl font-display font-light mb-6 tracking-tight text-white drop-shadow-2xl">
                Focus like <span className="text-sage-200">sunlight</span> <br />
                through trees.
              </h1>
              <p className="text-xl md:text-2xl text-white/80 font-light mb-12 max-w-2xl mx-auto drop-shadow-lg">
                The premium sanctuary for deep work. Reclaim your focus in a digital zen garden.
              </p>
              <motion.button
                onClick={() => {
                  localStorage.setItem('hasVisitedKomorebie', 'true');
                  navigate('/app');
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="group relative px-8 py-4 bg-sage-200 text-slate-950 rounded-full font-display font-medium text-lg flex items-center gap-2 overflow-hidden mx-auto cursor-pointer pointer-events-auto shadow-2xl"
              >
                <span className="relative z-10">Enter the Garden</span>
                <ArrowRight className="w-5 h-5 relative z-10 transition-transform group-hover:translate-x-1" />
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
              </motion.button>
            </motion.div>
          </section>

          <section className="py-32 px-4 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Leaf className="w-6 h-6 text-sage-200" />}
              title="Digital Zen"
              description="A garden of focused tasks. Grow your productivity with gentle, natural rhythms."
            />
            <FeatureCard
              icon={<Sparkles className="w-6 h-6 text-sage-200" />}
              title="Calm Notifications"
              description="Only what matters, when it matters. No pings, no urges, just gentle reminders."
            />
            <FeatureCard
              icon={<Zap className="w-6 h-6 text-sage-200" />}
              title="Flow Analytics"
              description="Insight without stress. Understand your rhythm through calm data visualization."
            />
          </section>

          <section className="px-4 py-32 text-center pb-64">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 2 }}
              className="max-w-3xl mx-auto"
            >
              <h2 className="text-4xl md:text-5xl font-display font-light mb-8 italic text-white/90">"The breath between tasks."</h2>
              <p className="text-lg text-white/60 font-light leading-relaxed">
                Komorebie is not just a productivity tool; it is a focus sanctuary. We prioritize negative space,
                soft transitions, and a total lack of visual noise.
              </p>
            </motion.div>
          </section>
        </div>
      </div>
    </SmoothScroll>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <motion.div
    whileHover={{ y: -10 }}
    transition={{ type: "spring", stiffness: 300 }}
  >
    <GlassCard className="h-full flex flex-col items-start text-left p-10">
      <div className="mb-6 p-3 rounded-2xl bg-white/5 border border-white/10">{icon}</div>
      <h3 className="text-2xl font-display font-light mb-4">{title}</h3>
      <p className="text-white/50 font-light leading-relaxed">{description}</p>
    </GlassCard>
  </motion.div>
);

export default LandingPage;
