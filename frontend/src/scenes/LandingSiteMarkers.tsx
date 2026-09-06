import React from 'react';
import { Html } from '@react-three/drei';
import { LandingCandidate } from '../types';

interface LandingSiteMarkersProps {
  visible: boolean;
  candidates: LandingCandidate[];
  selectedId: string | null;
  onSelectCandidate: (candidate: LandingCandidate) => void;
}

export const LandingSiteMarkers: React.FC<LandingSiteMarkersProps> = ({
  visible,
  candidates,
  selectedId,
  onSelectCandidate,
}) => {
  if (!visible || !candidates) return null;

  // Convert 128x128 grid coordinates (0 to 127) to 3D scene space (-10 to +10)
  const gridTo3D = (gx: number, gy: number): [number, number, number] => {
    const x = ((gx - 64) / 64) * 10.0;
    const z = ((gy - 64) / 64) * 10.0;
    const r = Math.sqrt(x * x + z * z);
    
    // Match terrain height profile
    let y = 0.0;
    if (r < 5.0) {
      y = -2.5 * (1.0 - (r / 5.0) ** 2);
    } else if (r >= 5.0 && r < 6.5) {
      y = 0.6 * Math.exp(-Math.pow((r - 5.0) / 0.75, 2));
    } else {
      y = 0.2 * Math.sin(x * 0.5) * Math.cos(z * 0.5);
    }

    return [x, y + 0.4, z];
  };

  return (
    <group>
      {candidates.map((site) => {
        const [x, y, z] = gridTo3D(site.grid_x, site.grid_y);
        const isSelected = selectedId === site.id;

        return (
          <group key={site.id} position={[x, y, z]}>
            {/* 3D Target Pin Cone */}
            <mesh position={[0, 0.4, 0]} onClick={() => onSelectCandidate(site)}>
              <coneGeometry args={[0.2, 0.6, 8]} />
              <meshBasicMaterial color={isSelected ? '#fbbf24' : '#38bdf8'} />
            </mesh>

            {/* Pulsing Base Ring */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
              <ringGeometry args={[0.3, 0.4, 16]} />
              <meshBasicMaterial color={isSelected ? '#fbbf24' : '#38bdf8'} transparent opacity={0.7} />
            </mesh>

            {/* 2D HTML Label Card */}
            <Html position={[0, 0.9, 0]} center distanceFactor={15}>
              <button
                onClick={() => onSelectCandidate(site)}
                className={`px-2 py-1 rounded text-xs font-mono border shadow-lg whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-amber-500/90 text-slate-950 border-amber-300 font-bold scale-110'
                    : 'bg-slate-900/90 text-cyan-400 border-cyan-500/40 hover:bg-slate-800'
                }`}
              >
                RANK #{site.rank} • {site.name} ({(site.composite_score ?? 0).toFixed(2)})
              </button>
            </Html>
          </group>
        );
      })}
    </group>
  );
};
