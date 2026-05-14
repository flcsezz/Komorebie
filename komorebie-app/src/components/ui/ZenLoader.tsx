import React from 'react';
import { motion } from 'framer-motion';
import { ALL_BACKGROUNDS } from '../../lib/backgrounds';

interface ZenLoaderProps {
  message?: string;
  fullscreen?: boolean;
}

const ZenLoader: React.FC<ZenLoaderProps> = ({ 
  message = "Entering the Sanctuary...", 
  fullscreen = false 
}) => {
  const bgImage = typeof window !== 'undefined' ? (localStorage.getItem('komorebie-bg') || ALL_BACKGROUNDS[0].url) : ALL_BACKGROUNDS[0].url;
  const isVideo = /\.(mp4|webm|mov|ogg)($|\?)/i.test(bgImage);

  return (
    <div className={`flex flex-col items-center justify-center overflow-hidden ${fullscreen ? 'min-h-screen relative bg-slate-950' : 'h-full py-20 relative'}`}>
      {fullscreen && (
        <div className="absolute inset-0 z-0">
          {isVideo ? (
            <video 
              src={bgImage} 
              autoPlay 
              loop 
              muted 
              playsInline 
              className="absolute inset-0 w-full h-full object-cover scale-[1.05]"
            />
          ) : (
            <div 
              className="absolute inset-0 bg-cover bg-center scale-[1.05]" 
              style={{ backgroundImage: `url(${bgImage})` }} 
            />
          )}
          {/* Blur & Darken Overlay */}
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-2xl" />
        </div>
      )}

      <div className="relative z-10 flex flex-col items-center justify-center">
        <div className="relative">
          {/* Soft light pulse (Komorebie effect) */}
          <motion.div
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute inset-0 bg-sage-200 blur-3xl rounded-full"
          />
          
          {/* Core pulse */}
          <motion.div
            animate={{
              scale: [0.8, 1.2, 0.8],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="relative w-4 h-4 bg-sage-100 rounded-full shadow-[0_0_20px_rgba(183,201,176,0.4)]"
          />
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="mt-8"
        >
          <span className="text-[10px] uppercase tracking-[0.5em] text-white/20 font-light ml-[0.5em]">
            {message}
          </span>
        </motion.div>
      </div>
    </div>
  );
};

export default ZenLoader;
