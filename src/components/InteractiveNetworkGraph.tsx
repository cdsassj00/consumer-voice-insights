import { useEffect, useRef, useState } from "react";

interface Node {
  id: string;
  label: string;
  x?: number;
  y?: number;
}

interface Edge {
  source: string;
  target: string;
}

interface InteractiveNetworkGraphProps {
  nodes: Node[];
  edges: Edge[];
}

export default function InteractiveNetworkGraph({ nodes, edges }: InteractiveNetworkGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const nodesRef = useRef<Map<string, { x: number; y: number; vx: number; vy: number }>>(new Map());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || nodes.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // 노드 초기화
    if (nodesRef.current.size === 0) {
      nodes.forEach((node, idx) => {
        const angle = (idx / nodes.length) * Math.PI * 2;
        const radius = Math.min(width, height) * 0.35;
        nodesRef.current.set(node.id, {
          x: width / 2 + Math.cos(angle) * radius,
          y: height / 2 + Math.sin(angle) * radius,
          vx: 0,
          vy: 0,
        });
      });
    }

    let animationId: number;

    const simulate = () => {
      // Force simulation
      const nodeList = Array.from(nodesRef.current.entries());
      
      // Repulsion force between nodes
      for (let i = 0; i < nodeList.length; i++) {
        for (let j = i + 1; j < nodeList.length; j++) {
          const [id1, node1] = nodeList[i];
          const [id2, node2] = nodeList[j];
          
          const dx = node2.x - node1.x;
          const dy = node2.y - node1.y;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = 800 / (distance * distance);
          
          const fx = (dx / distance) * force;
          const fy = (dy / distance) * force;
          
          node1.vx -= fx;
          node1.vy -= fy;
          node2.vx += fx;
          node2.vy += fy;
        }
      }

      // Attraction force for connected nodes
      edges.forEach(edge => {
        const source = nodesRef.current.get(edge.source);
        const target = nodesRef.current.get(edge.target);
        if (source && target) {
          const dx = target.x - source.x;
          const dy = target.y - source.y;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = distance * 0.01;
          
          const fx = (dx / distance) * force;
          const fy = (dy / distance) * force;
          
          source.vx += fx;
          source.vy += fy;
          target.vx -= fx;
          target.vy -= fy;
        }
      });

      // Center gravity
      nodeList.forEach(([id, node]) => {
        if (draggedNode === id) return;
        
        const dx = width / 2 - node.x;
        const dy = height / 2 - node.y;
        node.vx += dx * 0.001;
        node.vy += dy * 0.001;
      });

      // Update positions
      nodeList.forEach(([id, node]) => {
        if (draggedNode === id) return;
        
        node.vx *= 0.9; // damping
        node.vy *= 0.9;
        node.x += node.vx;
        node.y += node.vy;

        // Boundary
        const padding = 30;
        node.x = Math.max(padding, Math.min(width - padding, node.x));
        node.y = Math.max(padding, Math.min(height - padding, node.y));
      });

      // Render
      ctx.clearRect(0, 0, width, height);

      // Draw edges
      ctx.strokeStyle = "hsl(var(--border))";
      ctx.lineWidth = 1.5;
      edges.forEach(edge => {
        const source = nodesRef.current.get(edge.source);
        const target = nodesRef.current.get(edge.target);
        if (source && target) {
          ctx.beginPath();
          ctx.moveTo(source.x, source.y);
          ctx.lineTo(target.x, target.y);
          ctx.stroke();
        }
      });

      // Draw nodes
      nodes.forEach(node => {
        const pos = nodesRef.current.get(node.id);
        if (!pos) return;

        const isHovered = hoveredNode === node.id;
        const radius = isHovered ? 28 : 24;

        // Shadow
        ctx.shadowColor = "hsl(var(--primary) / 0.3)";
        ctx.shadowBlur = isHovered ? 15 : 8;
        
        // Node circle
        ctx.fillStyle = isHovered ? "hsl(var(--primary))" : "hsl(var(--primary) / 0.8)";
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;

        // Label
        ctx.fillStyle = "hsl(var(--primary-foreground))";
        ctx.font = isHovered ? "bold 12px sans-serif" : "11px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(node.label, pos.x, pos.y);
      });

      animationId = requestAnimationFrame(simulate);
    };

    simulate();

    return () => cancelAnimationFrame(animationId);
  }, [nodes, edges, hoveredNode, draggedNode]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isDragging && draggedNode) {
      const node = nodesRef.current.get(draggedNode);
      if (node) {
        node.x = x;
        node.y = y;
        node.vx = 0;
        node.vy = 0;
      }
      return;
    }

    let foundNode: string | null = null;
    for (const [id, pos] of nodesRef.current.entries()) {
      const dx = x - pos.x;
      const dy = y - pos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < 24) {
        foundNode = id;
        break;
      }
    }
    setHoveredNode(foundNode);
    canvas.style.cursor = foundNode ? "pointer" : "default";
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (hoveredNode) {
      setIsDragging(true);
      setDraggedNode(hoveredNode);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggedNode(null);
  };

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={400}
      className="w-full h-[400px] rounded-lg bg-muted/20 border"
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    />
  );
}
