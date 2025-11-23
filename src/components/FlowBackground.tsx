import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const FlowParticles = () => {
  const pointsRef = useRef<THREE.Points>(null);
  const mousePosition = useRef({ x: 0, y: 0 });
  const targetPositions = useRef<Float32Array>();
  const velocities = useRef<Float32Array>();

  const particleCount = 1500;

  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const vels = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;

      const color = new THREE.Color();
      // Brighter, more vibrant colors
      color.setHSL(0.55 + Math.random() * 0.3, 0.9, 0.6 + Math.random() * 0.2);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      vels[i * 3] = 0;
      vels[i * 3 + 1] = 0;
      vels[i * 3 + 2] = 0;
    }

    targetPositions.current = positions;
    velocities.current = vels;

    return { positions, colors };
  }, []);

  useFrame((state) => {
    if (!pointsRef.current || !targetPositions.current || !velocities.current) return;

    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
    const time = state.clock.getElapsedTime();

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      // Calculate distance to mouse
      const dx = mousePosition.current.x - positions[i3];
      const dy = mousePosition.current.y - positions[i3 + 1];
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Stronger flow effect towards mouse with larger radius
      if (distance < 8) {
        const force = (8 - distance) / 8;
        velocities.current[i3] += dx * 0.003 * force;
        velocities.current[i3 + 1] += dy * 0.003 * force;
      }

      // Apply wave motion
      const waveX = Math.sin(time * 0.5 + positions[i3] * 0.1) * 0.02;
      const waveY = Math.cos(time * 0.3 + positions[i3 + 1] * 0.1) * 0.02;
      
      velocities.current[i3] += waveX;
      velocities.current[i3 + 1] += waveY;

      // Apply velocity with damping
      positions[i3] += velocities.current[i3];
      positions[i3 + 1] += velocities.current[i3 + 1];
      positions[i3 + 2] += Math.sin(time * 0.5 + i * 0.1) * 0.01;

      // Damping
      velocities.current[i3] *= 0.95;
      velocities.current[i3 + 1] *= 0.95;

      // Boundary check - wrap around
      if (positions[i3] > 10) positions[i3] = -10;
      if (positions[i3] < -10) positions[i3] = 10;
      if (positions[i3 + 1] > 10) positions[i3 + 1] = -10;
      if (positions[i3 + 1] < -10) positions[i3 + 1] = 10;
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  // Handle mouse movement
  if (typeof window !== 'undefined') {
    window.addEventListener('mousemove', (event) => {
      mousePosition.current.x = ((event.clientX / window.innerWidth) * 2 - 1) * 10;
      mousePosition.current.y = (-(event.clientY / window.innerHeight) * 2 + 1) * 10;
    });
  }

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particleCount}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.25}
        vertexColors
        transparent
        opacity={0.9}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

export const FlowBackground = () => {
  return (
    <div className="fixed inset-0 -z-10">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 75 }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.5} />
        <FlowParticles />
      </Canvas>
    </div>
  );
};
