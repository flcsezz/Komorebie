import React, { useRef, useEffect, useState } from 'react';

interface ResilientVideoProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
  src: string;
}

/**
 * A video component designed to be "bulletproof" against browser autoplay policies,
 * slow connections, and accidental pausing.
 */
const ResilientVideo: React.FC<ResilientVideoProps> = ({ src, className, ...props }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isBuffering, setIsBuffering] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = async () => {
      try {
        if (video.paused) {
          await video.play();
        }
      } catch (err) {
        console.warn('[ResilientVideo] Autoplay blocked or interrupted:', err);
        // On failure, we'll try again if the user interacts or if we get a 'canplay' event
      }
    };

    const handleWaiting = () => setIsBuffering(true);
    const handlePlaying = () => setIsBuffering(false);
    const handleStalled = () => {
      console.warn('[ResilientVideo] Playback stalled, attempting recovery...');
      handlePlay();
    };

    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('stalled', handleStalled);
    video.addEventListener('suspend', handlePlay); // Sometimes browsers suspend inactive tabs

    // Initial play attempt
    handlePlay();

    // Polling check to ensure it hasn't stayed paused accidentally (every 5 seconds)
    const interval = setInterval(() => {
      if (video.paused && !video.ended && video.readyState >= 2) {
        handlePlay();
      }
    }, 5000);

    return () => {
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('stalled', handleStalled);
      video.removeEventListener('suspend', handlePlay);
      clearInterval(interval);
    };
  }, [src, retryCount]);

  return (
    <div className={`relative w-full h-full ${className}`}>
      <video
        ref={videoRef}
        src={src}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        crossOrigin="anonymous"
        className="w-full h-full object-cover video-optimize-quality transition-opacity duration-1000"
        style={{ opacity: isBuffering ? 0.8 : 1 }}
        {...props}
      />
      
      {/* Subtle loading indicator if stalled for a long time */}
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/5">
          <div className="w-1 h-1 bg-white/20 rounded-full animate-ping" />
        </div>
      )}
    </div>
  );
};

export default ResilientVideo;
