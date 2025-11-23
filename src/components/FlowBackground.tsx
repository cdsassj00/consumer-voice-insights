import { useEffect, useRef } from "react";

// 브랜드 보라색 계열 플로우 파티클 배경 (Canvas 2D 버전)
// - 기본적으로 은은하게 항상 보이고
// - 마우스를 움직이면 그 경로를 따라 파티클이 밝게 따라오는 효과

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseSize: number;
  noiseOffset: number;
}

const createParticles = (width: number, height: number, count: number): Particle[] => {
  const particles: Particle[] = [];

  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 1.2,
      vy: (Math.random() - 0.5) * 1.2,
      baseSize: 1.2 + Math.random() * 1.8,
      noiseOffset: Math.random() * Math.PI * 2,
    });
  }

  return particles;
};

export const FlowBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const mouseRef = useRef({ x: 0, y: 0, active: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize);

    let particles = createParticles(canvas.clientWidth, canvas.clientHeight, 260);

    const handleMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = event.clientX - rect.left;
      mouseRef.current.y = event.clientY - rect.top;
      mouseRef.current.active = true;
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    let lastTime = 0;

    const render = (time: number) => {
      const delta = (time - lastTime) / 1000;
      lastTime = time;

      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      // 사이즈가 바뀌었으면 파티클 재생성
      if (particles.length === 0 || width === 0 || height === 0) {
        particles = createParticles(width, height, 260);
      }

      ctx.clearRect(0, 0, width, height);

      // 약한 보라색 그라디언트 베이스 (아이덴티티 강조)
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, "hsla(262, 88%, 72%, 0.14)");
      gradient.addColorStop(1, "hsla(270, 90%, 65%, 0.08)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      const mouse = mouseRef.current;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // 부드러운 부유감 + 미세한 노이즈
        p.x += p.vx + Math.cos(time * 0.001 + p.noiseOffset) * 0.8;
        p.y += p.vy + Math.sin(time * 0.001 + p.noiseOffset) * 0.8;

        // 화면 밖으로 나가면 다시 반대편에서 등장
        if (p.x < -50) p.x = width + 50;
        if (p.x > width + 50) p.x = -50;
        if (p.y < -50) p.y = height + 50;
        if (p.y > height + 50) p.y = -50;

        // 마우스와의 거리 계산 (플로우 효과)
        let highlight = 0;
        if (mouse.active) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const radius = 180; // 마우스 영향 반경

          if (dist < radius) {
            const t = 1 - dist / radius;
            highlight = t * t; // 중심부에서 더 강하게

            // 마우스 방향으로 약간 끌려가는 느낌
            p.x += (dx / dist || 0) * 12 * delta * t;
            p.y += (dy / dist || 0) * 12 * delta * t;
          }
        }

        const pulse = 0.4 + 0.3 * Math.sin(time * 0.0015 + p.noiseOffset * 2);
        const alpha = Math.min(1, 0.2 + pulse * 0.4 + highlight * 0.8);
        const size = p.baseSize + highlight * 2.2;

        ctx.beginPath();
        ctx.fillStyle = `hsla(266, 89%, 68%, ${alpha.toFixed(3)})`;
        ctx.shadowColor = "hsla(266, 89%, 72%, 0.55)";
        ctx.shadowBlur = 14 + highlight * 26;
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.shadowBlur = 0;

      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <div className="fixed inset-0 -z-10 pointer-events-none">
      <canvas ref={canvasRef} className="w-full h-full" aria-hidden="true" />
    </div>
  );
};
