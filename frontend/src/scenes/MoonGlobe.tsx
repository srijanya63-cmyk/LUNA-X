import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Html } from '@react-three/drei';

interface MoonGlobeProps {
  visible: boolean;
  onSelectSouthPole?: () => void;
}

export const MoonGlobe: React.FC<MoonGlobeProps> = ({ visible, onSelectSouthPole }) => {
  const moonGroupRef = useRef<THREE.Group>(null);
  const sphereRef = useRef<THREE.Mesh>(null);

  // Generate procedural realistic lunar surface texture & bump map
  const { moonTexture, bumpTexture } = useMemo(() => {
    const width = 1024;
    const height = 512;

    // 1. Surface Color Texture Canvas
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    // 2. Bump Map Canvas
    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = width;
    bumpCanvas.height = height;
    const bumpCtx = bumpCanvas.getContext('2d')!;

    const imgData = ctx.createImageData(width, height);
    const bumpData = bumpCtx.createImageData(width, height);
    const data = imgData.data;
    const bData = bumpData.data;

    // Procedural noise & crater generation
    for (let y = 0; y < height; y++) {
      const lat = (y / height) * Math.PI - Math.PI / 2;
      for (let x = 0; x < width; x++) {
        const lon = (x / width) * Math.PI * 2 - Math.PI;
        const idx = (y * width + x) * 4;

        // Base Lunar Highlands Albedo (Sharper cool contrast)
        let noiseVal =
          Math.sin(x * 0.05) * 0.18 +
          Math.cos(y * 0.05) * 0.18 +
          Math.sin(x * 0.12 + y * 0.1) * 0.12;

        // Lunar Maria (Dark Basaltic Plains) simulation
        const isMaria =
          Math.sin(lon * 1.5 + 0.5) > 0.3 && Math.cos(lat * 2.0) > 0.1;
        let baseShade = isMaria ? 65 + noiseVal * 35 : 165 + noiseVal * 45;

        // Impact Craters (Tycho, Shackleton, Copernicus style structure)
        const cx1 = width * 0.45, cy1 = height * 0.85, r1 = 35; // South Pole Shackleton
        const cx2 = width * 0.65, cy2 = height * 0.70, r2 = 45; // Tycho
        const cx3 = width * 0.25, cy3 = height * 0.35, r3 = 50; // Copernicus

        const d1 = Math.hypot(x - cx1, y - cy1);
        const d2 = Math.hypot(x - cx2, y - cy2);
        const d3 = Math.hypot(x - cx3, y - cy3);

        let heightBump = baseShade;

        [ { d: d1, r: r1 }, { d: d2, r: r2 }, { d: d3, r: r3 } ].forEach(({ d, r }) => {
          if (d < r) {
            const normD = d / r;
            if (normD > 0.75) {
              // Crater Rim (High Brightness Contrast)
              baseShade += 85 * (1.0 - (normD - 0.75) / 0.25);
              heightBump += 110;
            } else {
              // Crater Basin Interior
              baseShade -= 55 * (1.0 - normD);
              heightBump -= 70;
            }
          }
        });

        // Authentic Lunar Gray RGB Tone
        const rColor = Math.min(255, Math.max(0, baseShade + 10));
        const gColor = Math.min(255, Math.max(0, baseShade + 12));
        const bColor = Math.min(255, Math.max(0, baseShade + 15));

        data[idx] = rColor;
        data[idx + 1] = gColor;
        data[idx + 2] = bColor;
        data[idx + 3] = 255;

        // Bump Map Grayscale
        const bVal = Math.min(255, Math.max(0, heightBump));
        bData[idx] = bVal;
        bData[idx + 1] = bVal;
        bData[idx + 2] = bVal;
        bData[idx + 3] = 255;
      }
    }

    ctx.putImageData(imgData, 0, 0);
    bumpCtx.putImageData(bumpData, 0, 0);

    const mTex = new THREE.CanvasTexture(canvas);
    const bTex = new THREE.CanvasTexture(bumpCanvas);
    mTex.wrapS = THREE.RepeatWrapping;
    mTex.wrapT = THREE.ClampToEdgeWrapping;
    bTex.wrapS = THREE.RepeatWrapping;
    bTex.wrapT = THREE.ClampToEdgeWrapping;

    return { moonTexture: mTex, bumpTexture: bTex };
  }, []);

  // Continuous smooth Y-axis rotation independent of OrbitControls
  useFrame((_, delta) => {
    if (moonGroupRef.current) {
      moonGroupRef.current.rotation.y += delta * 0.03;
    }
  });

  if (!visible) return null;

  return (
    <group ref={moonGroupRef}>
      {/* Subtle Lunar Ambient Light behind Moon Globe */}
      <pointLight position={[6, 5, -8]} intensity={1.5} color="#164a70" />

      {/* 3D Photorealistic Moon Sphere */}
      <mesh
        ref={sphereRef}
        position={[0, 0, 0]}
        onClick={onSelectSouthPole}
      >
        <sphereGeometry args={[4, 64, 64]} />
        <meshStandardMaterial
          map={moonTexture}
          bumpMap={bumpTexture}
          bumpScale={0.14}
          roughness={0.85}
          metalness={0.05}
        />
      </mesh>

      {/* South Pole Target Reticle Ring */}
      <mesh position={[0, -3.95, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.5, 0.62, 32]} />
        <meshBasicMaterial color="#38bdf8" side={THREE.DoubleSide} transparent opacity={0.85} />
      </mesh>

      {/* Subtle Lunar Blue Atmospheric Glow Shell */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[4.14, 32, 32]} />
        <meshBasicMaterial color="#164a70" transparent opacity={0.16} side={THREE.BackSide} />
      </mesh>

      {/* South Pole Ident Label */}
      <Html position={[0, -4.3, 0]} center distanceFactor={14}>
        <button
          onClick={onSelectSouthPole}
          className="bg-slate-950/90 text-sky-400 border border-sky-400/50 px-2.5 py-1 rounded text-[11px] font-mono font-bold shadow-lg hover:bg-sky-500 hover:text-white transition-all flex items-center space-x-1.5 whitespace-nowrap"
        >
          <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
          <span>SOUTH POLE (89.8°S)</span>
        </button>
      </Html>
    </group>
  );
};
