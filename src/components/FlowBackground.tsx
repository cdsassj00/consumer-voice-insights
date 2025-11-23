import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const FlowParticles = () => {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const mousePosition = useRef({ x: 0, y: 0 });
  const mouseTrail = useRef<Array<{ x: number; y: number; time: number }>>([]);

  const particleCount = 2000;

  const { positions, colors, sizes, opacities } = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const opacities = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 5;

      const color = new THREE.Color();
      // 보라색 계열 (HSL: 0.75-0.85)
      color.setHSL(0.75 + Math.random() * 0.1, 0.85, 0.6 + Math.random() * 0.2);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      sizes[i] = 0.2 + Math.random() * 0.15;
      opacities[i] = 0; // Start hidden
    }

    return { positions, colors, sizes, opacities };
  }, []);

  useFrame((state) => {
    if (!pointsRef.current) return;

    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
    const opacities = pointsRef.current.geometry.attributes.opacity.array as Float32Array;
    const time = state.clock.getElapsedTime();

    // 마우스 현재 위치만 사용해서, 주변 입자들이 숨쉬듯 나타났다 사라지도록 처리
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const px = positions[i3];
      const py = positions[i3 + 1];

      const dx = mousePosition.current.x - px;
      const dy = mousePosition.current.y - py;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // 마우스 주변 반경 안에 있는 입자들만 강하게 활성화
      const radius = 5;
      let targetOpacity = 0;
      if (distance < radius) {
        targetOpacity = 1 - distance / radius; // 가까울수록 더 밝게
      }

      // 부드럽게 숨쉬는 듯한 페이드 인/아웃
      opacities[i] += (targetOpacity - opacities[i]) * 0.25;

      // 전체에 아주 약한 부유감 부여
      positions[i3 + 2] = Math.sin(time * 0.4 + i * 0.05) * 0.4;
    }

    pointsRef.current.geometry.attributes.opacity.needsUpdate = true;
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
        <bufferAttribute
          attach="attributes-size"
          count={particleCount}
          array={sizes}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-opacity"
          count={particleCount}
          array={opacities}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={`
          attribute float size;
          attribute vec3 color;
          attribute float opacity;
          varying vec3 vColor;
          varying float vOpacity;
          
          void main() {
            vColor = color;
            vOpacity = opacity;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = size * 100.0 * (1.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
          }
        `}
        fragmentShader={`
          varying vec3 vColor;
          varying float vOpacity;
          
          void main() {
            float dist = length(gl_PointCoord - vec2(0.5));
            if (dist > 0.5) discard;
            
            float alpha = (1.0 - dist * 2.0) * vOpacity;
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
