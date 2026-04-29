import { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, ContactShadows, Environment, OrbitControls } from '@react-three/drei';
import { motion } from 'framer-motion';

useGLTF.preload('/model.glb');

function Model() {
  const { scene } = useGLTF('/model.glb');
  const groupRef = useRef();

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.4;
    }
  });

  return (
    <group ref={groupRef}>
      <primitive
        object={scene}
        scale={2.1}
        position={[0, 0, 0]}
        castShadow
        receiveShadow
      />
    </group>
  );
}

function FallbackSphere() {
  return (
    <mesh>
      <sphereGeometry args={[1, 32, 32]} />
      <meshStandardMaterial color="#1e3a8a" opacity={0.6} transparent />
    </mesh>
  );
}

export default function GLBViewer({ size = 480 }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
      style={{
        width: size,
        height: size,
        position: 'relative',
        borderRadius: '50%',   /* ← circular clip = globe shape */
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      <Canvas
        shadows
        dpr={[1, 1.5]}
        /* Camera pulled back so whole globe is visible */
        camera={{ position: [0, 0.3, 4.8], fov: 32 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent', width: '100%', height: '100%' }}
      >
        {/* Low ambient — keeps the night side realistically dark */}
        <ambientLight intensity={0.15} />

        {/* PRIMARY SUN — upper-right, bright warm light */}
        <directionalLight
          castShadow
          position={[6, 5, 3]}
          intensity={2.8}
          color="#fff5e0"
          shadow-mapSize={[1024, 1024]}
          shadow-camera-near={0.5}
          shadow-camera-far={30}
          shadow-camera-top={5}
          shadow-camera-bottom={-5}
          shadow-camera-left={-5}
          shadow-camera-right={5}
        />

        {/* ATMOSPHERIC RIM — blue glow on the lit edge (atmosphere scatter) */}
        <pointLight position={[4, 2, 5]} intensity={1.2} color="#3b82f6" distance={12} />

        {/* SECONDARY fill — very soft blue on the shadow transition zone */}
        <directionalLight position={[-3, 1, 2]} intensity={0.18} color="#60a5fa" />

        {/* NIGHT SIDE KILL — pulls brightness out of the dark hemisphere */}
        <pointLight position={[-5, -2, -5]} intensity={1.0} color="#000005" distance={15} />

        <Environment preset="night" />

        <Suspense fallback={<FallbackSphere />}>
          <Model />

          {/* Soft black shadow directly below */}
          <ContactShadows
            position={[0, -2.2, 0]}
            opacity={0.65}
            scale={4}
            blur={2.5}
            far={4}
            color="#000000"
          />
        </Suspense>

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 1.6}
          autoRotate={false}
        />
      </Canvas>

      {/* Dark edge vignette so globe fades into bg */}
      <div style={{
        position: 'absolute',
        inset: 0,
        borderRadius: '50%',
        background: 'radial-gradient(ellipse at 50% 50%, transparent 52%, rgba(5,11,24,0.92) 100%)',
        pointerEvents: 'none',
        zIndex: 10,
      }} />

      {/* Bottom shadow cast on "floor" */}
      <div style={{
        position: 'absolute',
        bottom: '-6%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '60%',
        height: '12%',
        background: 'radial-gradient(ellipse, rgba(0,0,0,0.7) 0%, transparent 80%)',
        filter: 'blur(14px)',
        zIndex: 11,
        borderRadius: '50%',
        pointerEvents: 'none',
      }} />
    </motion.div>
  );
}
