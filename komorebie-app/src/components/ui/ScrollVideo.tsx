import React, { useRef, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

interface ScrollVideoProps {
  src: string;
  className?: string;
}

const ScrollVideo: React.FC<ScrollVideoProps> = ({ src, className }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Use useTransform to map scroll progress to video time
  // Note: We'll update the video currentTime in a useEffect for better control
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const unsubscribe = scrollYProgress.onChange((v) => {
      if (video.duration) {
        // Scrub the video based on scroll progress
        video.currentTime = v * video.duration;
      }
    });

    return () => unsubscribe();
  }, [scrollYProgress]);

  return (
    <div ref={containerRef} className={`relative h-[300vh] ${className}`}>
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <video
          ref={videoRef}
          src={src}
          muted
          playsInline
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-slate-950/40" />
      </div>
    </div>
  );
};

export default ScrollVideo;
