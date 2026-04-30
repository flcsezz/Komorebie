import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sparkles, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

const ForestParticles = () => {
  return (
    <Sparkles
      count={100}
      scale={20}
      size={2}
      speed={0.4}
      opacity={0.3}
      color="#B7C9B0"
    />
  );
};

const DappledLight = () => {
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    if (lightRef.current) {
      const t = state.clock.getElapsedTime();
      lightRef.current.position.x = Math.sin(t * 0.5) * 5;
      lightRef.current.position.y = Math.cos(t * 0.3) * 5;
    }
  });

  return (
    <pointLight
      ref={lightRef}
      intensity={1.5}
      distance={20}
      color="#B7C9B0"
      position={[0, 5, 5]}
    />
  );
};

const AmbientEnvironment = () => {
  return (
    <>
      <color attach="background" args={['#121212']} />
      <fog attach="fog" args={['#121212', 5, 25]} />
      <ambientLight intensity={0.2} />
      <DappledLight />
      <ForestParticles />
      <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
        <mesh position={[0, -2, -5]}>
          <sphereGeometry args={[10, 32, 32]} />
          <meshStandardMaterial
            color="#1A1A1A"
            roughness={0.8}
            metalness={0.2}
            side={THREE.BackSide}
          />
        </mesh>
      </Float>
    </>
  );
};

const ZenEnvironment: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none">
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 10]} />
        <AmbientEnvironment />
      </Canvas>
    </div>
  );
};

export default ZenEnvironment;
