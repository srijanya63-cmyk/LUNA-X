import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { MoonGlobe } from './MoonGlobe';
import { SouthPoleTerrain } from './SouthPoleTerrain';
import { LandingSiteMarkers } from './LandingSiteMarkers';
import { RoverTraverse } from './RoverTraverse';
import { useUIStore } from '../stores/useUIStore';
import { useTerrainStore } from '../stores/useTerrainStore';
import { useMissionStore } from '../stores/useMissionStore';

interface CameraControllerProps {
  controlsRef: React.RefObject<any>;
  terrainGroupRef: React.RefObject<THREE.Group>;
}

const CameraController: React.FC<CameraControllerProps> = ({ controlsRef, terrainGroupRef }) => {
  const viewMode = useUIStore((s) => s.viewMode);

  useFrame(({ camera }) => {
    const targetPos = new THREE.Vector3(0, 5, 14);
    const targetLook = new THREE.Vector3(0, 0, 0);

    if (viewMode === 'global_moon') {
      targetPos.set(0, 3, 14);
      targetLook.set(0, 0, 0);
    } else if (viewMode === 'south_pole') {
      targetPos.set(0, 12, 14);
      targetLook.set(0, -1, 0);
    } else if (viewMode === 'mission_twin') {
      const isPlaying = useMissionStore.getState().isPlaying;
      const missionPlan = useMissionStore.getState().missionPlan;
      const roverNodeIndex = useMissionStore.getState().roverNodeIndex;

      if (isPlaying && missionPlan && missionPlan.path && missionPlan.path.length > 0) {
        const [gx, gy] = missionPlan.path[Math.min(roverNodeIndex, missionPlan.path.length - 1)];
        const lx = ((gx - 64) / 64) * 10.0;
        const lz = ((gy - 64) / 64) * 10.0;
        const r = Math.sqrt(lx * lx + lz * lz);
        let ly = 0.0;
        if (r < 5.0) {
          ly = -2.5 * (1.0 - (r / 5.0) ** 2);
        } else if (r >= 5.0 && r < 6.5) {
          ly = 0.6 * Math.exp(-Math.pow((r - 5.0) / 0.75, 2));
        } else {
          ly = 0.2 * Math.sin(lx * 0.5) * Math.cos(lz * 0.5);
        }

        // Account for parent terrain group Y-rotation
        const rotY = terrainGroupRef.current ? terrainGroupRef.current.rotation.y : 0;
        const wx = lx * Math.cos(rotY) + lz * Math.sin(rotY);
        const wz = -lx * Math.sin(rotY) + lz * Math.cos(rotY);
        const wy = ly - 0.5;

        targetLook.set(wx, wy + 0.1, wz);
        targetPos.set(wx, wy + 5.5, wz + 7.5);
      } else {
        targetPos.set(0, 9, 11);
        targetLook.set(0, -1, 0);
      }
    }

    camera.position.lerp(targetPos, 0.05);

    if (controlsRef.current) {
      controlsRef.current.target.lerp(targetLook, 0.05);
      controlsRef.current.update();
    }
  });

  return null;
};

interface RotatingTerrainWrapperProps {
  terrainGroupRef: React.RefObject<THREE.Group>;
  children: React.ReactNode;
}

const RotatingTerrainWrapper: React.FC<RotatingTerrainWrapperProps> = ({ terrainGroupRef, children }) => {
  useFrame((_, delta) => {
    if (terrainGroupRef.current) {
      terrainGroupRef.current.rotation.y += delta * 0.025; // Smooth slow rotation (~60s per turn)
    }
  });

  return <group ref={terrainGroupRef}>{children}</group>;
};

const TwinklingDeepSpace: React.FC = () => {
  const pointsRef = useRef<THREE.Points>(null!);
  const count = 3500;

  const { positions, baseColors, phases, speeds } = React.useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const ph = new Float32Array(count);
    const sp = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 60 + Math.random() * 120;

      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);

      const tone = Math.random();
      let cr = 0.9, cg = 0.95, cb = 1.0;
      if (tone > 0.85) {
        cr = 1.0; cg = 0.9; cb = 0.7;
      } else if (tone < 0.15) {
        cr = 0.7; cg = 0.85; cb = 1.0;
      }

      const isProminent = Math.random() > 0.9;
      const factor = isProminent ? 1.0 : 0.4 + Math.random() * 0.4;

      col[i * 3] = cr * factor;
      col[i * 3 + 1] = cg * factor;
      col[i * 3 + 2] = cb * factor;

      ph[i] = Math.random() * Math.PI * 2;
      sp[i] = 0.8 + Math.random() * 2.5;
    }

    return { positions: pos, baseColors: col, phases: ph, speeds: sp };
  }, [count]);

  const liveColors = React.useMemo(() => new Float32Array(baseColors), [baseColors]);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const t = clock.getElapsedTime();
    const colorAttr = pointsRef.current.geometry.attributes.color;

    if (colorAttr) {
      const colors = colorAttr.array as Float32Array;
      for (let i = 0; i < count; i++) {
        const twinkle = 0.55 + 0.45 * Math.sin(t * speeds[i] + phases[i]);
        colors[i * 3] = baseColors[i * 3] * twinkle;
        colors[i * 3 + 1] = baseColors[i * 3 + 1] * twinkle;
        colors[i * 3 + 2] = baseColors[i * 3 + 2] * twinkle;
      }
      colorAttr.needsUpdate = true;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[liveColors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.25}
        vertexColors
        transparent
        opacity={0.9}
        sizeAttenuation
      />
    </points>
  );
};

export const LunarMissionScene: React.FC = () => {
  const controlsRef = useRef<any>(null);
  const terrainGroupRef = useRef<THREE.Group>(null!);
  const viewMode = useUIStore((s) => s.viewMode);
  const setViewMode = useUIStore((s) => s.setViewMode);
  const activeLayer = useUIStore((s) => s.activeLayer);
  const performanceSettings = useUIStore((s) => s.performanceSettings);
  const sunAngleDeg = useMissionStore((s) => s.sunAngleDeg);

  const landingCandidates = useTerrainStore((s) => s.landingCandidates);
  const selectedCandidate = useTerrainStore((s) => s.selectedCandidate);
  const setSelectedCandidate = useTerrainStore((s) => s.setSelectedCandidate);

  // Compute dynamic sunlight direction vector
  const sunRad = (sunAngleDeg * Math.PI) / 180;
  const sunX = Math.cos(sunRad) * 25;
  const sunZ = Math.sin(sunRad) * 25;

  return (
    <div className="w-full h-full relative deep-space-canvas select-none overflow-hidden">
      {/* 3D WebGL Canvas */}
      <Canvas camera={{ position: [0, 5, 14], fov: 45 }}>
        <CameraController controlsRef={controlsRef} terrainGroupRef={terrainGroupRef} />
        
        {/* Dynamic Sunlight & Illumination */}
        <ambientLight intensity={0.35} />
        <directionalLight
          position={[sunX, 20, sunZ]}
          intensity={2.2}
          color="#fffdf0"
          castShadow={performanceSettings.enableShadows}
        />
        <pointLight position={[-15, -10, -15]} intensity={0.5} color="#38bdf8" />

        {/* Deep Space Background Twinkling Stars */}
        <TwinklingDeepSpace />


        {/* 3D Scenes */}
        <MoonGlobe
          visible={viewMode === 'global_moon'}
          onSelectSouthPole={() => setViewMode('south_pole')}
        />

        <RotatingTerrainWrapper terrainGroupRef={terrainGroupRef}>
          <SouthPoleTerrain
            visible={viewMode === 'south_pole' || viewMode === 'mission_twin'}
            activeLayer={activeLayer}
          />

          <LandingSiteMarkers
            visible={viewMode === 'south_pole' || viewMode === 'mission_twin'}
            candidates={landingCandidates}
            selectedId={selectedCandidate?.id || null}
            onSelectCandidate={setSelectedCandidate}
          />

          <RoverTraverse visible={viewMode === 'mission_twin'} />
        </RotatingTerrainWrapper>

        <OrbitControls ref={controlsRef} enablePan enableZoom maxDistance={30} minDistance={3} />
      </Canvas>

      {/* Futuristic Viewport Tactical Overlays */}
      <div className="pointer-events-none absolute inset-0 z-10 p-6 flex flex-col justify-between">
        {/* Tactical Corner Brackets */}
        <div className="flex justify-between items-start">
          <div className="w-8 h-8 border-t-2 border-l-2 border-sky-400/70" />
          <div className="w-8 h-8 border-t-2 border-r-2 border-sky-400/70" />
        </div>

        {/* Tactical Telemetry Reticle in Global Moon View */}
        {viewMode === 'global_moon' && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-auto">
            <div className="w-32 h-32 rounded-full border border-sky-400/30 border-dashed animate-[spin_20s_linear_infinite] flex items-center justify-center mx-auto mb-3">
              <div className="w-24 h-24 rounded-full border border-sky-400/50 flex items-center justify-center">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-ping" />
              </div>
            </div>
            <button
              onClick={() => setViewMode('south_pole')}
              className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 border border-sky-300 text-white font-tech font-bold text-xs tracking-widest shadow-lg transition-all duration-200"
            >
              ENGAGE LUNAR SOUTH POLE
            </button>
          </div>
        )}

        <div className="flex justify-between items-end">
          <div className="w-8 h-8 border-b-2 border-l-2 border-sky-400/70" />
          {/* Viewport Coordinates Telemetry */}
          <div className="font-mono text-[10px] text-sky-400/90 tracking-widest uppercase bg-slate-900/60 px-3 py-1 rounded-md backdrop-blur-sm">
            <span>SYS: 89.8°S | 0.0°E • ALTIMETER: LRO-LOLA DEM • RENDER: R3F WEBGL</span>
          </div>
          <div className="w-8 h-8 border-b-2 border-r-2 border-sky-400/70" />
        </div>
      </div>
    </div>
  );
};
