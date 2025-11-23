import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const FlowParticles = () => {
  const pointsRef = useRef<THREE.Points>(null);
  const mousePosition = useRef({ x: 0, y: 0 });
  const mouseTrail = useRef<Array<{ x: number; y: number; time: number }>>([]);
  const particleLife = useRef<Float32Array>();

  const particleCount = 2000;

  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const life = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 5;

      const color = new THREE.Color();
      color.setHSL(0.55 + Math.random() * 0.3, 0.95, 0.65);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      life[i] = 0; // Start hidden
    }

    particleLife.current = life;

    return { positions, colors };
  }, []);

  useFrame((state) => {
    if (!pointsRef.current || !particleLife.current) return;

    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
    const sizes = pointsRef.current.geometry.attributes.size.array as Float32Array;
    const time = state.clock.getElapsedTime();

    // Add current mouse position to trail
    mouseTrail.current.push({
      x: mousePosition.current.x,
      y: mousePosition.current.y,
      time: time
    });

    // Keep only recent trail (last 2 seconds)
    mouseTrail.current = mouseTrail.current.filter(point => time - point.time < 2);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const px = positions[i3];
      const py = positions[i3 + 1];

      // Check if particle is near any point in mouse trail
      let maxActivation = 0;
      
      for (let j = 0; j < mouseTrail.current.length; j++) {
        const trail = mouseTrail.current[j];
        const dx = trail.x - px;
        const dy = trail.y - py;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const timeSinceTrail = time - trail.time;
        
        // Wave effect: particles activate based on distance and time
        const waveRadius = 6;
        const waveSpeed = 4; // Speed of the wave spreading
        const expectedDistance = timeSinceTrail * waveSpeed;
        const distanceFromWave = Math.abs(distance - expectedDistance);
        
        if (distanceFromWave < 1.5 && timeSinceTrail < 1) {
          // Particle is in the wave
          const activation = Math.max(0, 1 - distanceFromWave / 1.5) * (1 - timeSinceTrail);
          maxActivation = Math.max(maxActivation, activation);
        }
      }

      // Update particle life (breathing effect)
      if (maxActivation > 0) {
        particleLife.current[i] = Math.min(1, particleLife.current[i] + 0.15);
      } else {
        particleLife.current[i] = Math.max(0, particleLife.current[i] - 0.03);
      }

      // Apply breathing animation
      const breath = Math.sin(time * 2 + i * 0.1) * 0.1 + 0.9;
      const finalLife = particleLife.current[i] * breath;

      // Update size based on life
      sizes[i] = finalLife * (0.2 + Math.random() * 0.15);

      // Subtle floating motion
      positions[i3 + 2] = Math.sin(time * 0.3 + i * 0.05) * 0.3;
    }

    pointsRef.current.geometry.attributes.size.needsUpdate = true;
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  // Handle mouse movement
  if (typeof window !== 'undefined') {
    window.addEventListener('mousemove', (event) => {
      mousePosition.current.x = ((event.clientX / window.innerWidth) * 2 - 1) * 10;
      mousePosition.current.y = (-(event.clientY / window.innerHeight) * 2 + 1) * 10;
    });
  }

  const sizes = useMemo(() => {
    const sizes = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
      sizes[i] = 0; // Start with size 0
    }
    return sizes;
  }, []);

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
        <bufferAttribute
          attach="attributes-size"
          count={particleCount}
          array={sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={`
          attribute float size;
          attribute vec3 color;
          varying vec3 vColor;
          varying float vSize;
          
          void main() {
            vColor = color;
            vSize = size;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = size * 100.0 * (1.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
          }
        `}
        fragmentShader={`
          varying vec3 vColor;
          varying float vSize;
          
          void main() {
            float dist = length(gl_PointCoord - vec2(0.5));
            if (dist > 0.5) discard;
            
            float alpha = (1.0 - dist * 2.0) * vSize * 2.0;
            gl_FragColor = vec4(vColor, alpha);
          }
        `}
        transparent
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
        <ambientLight intensity={0.3} />
        <FlowParticles />
      </Canvas>
    </div>
  );
};
