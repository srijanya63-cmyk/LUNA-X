import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { useMissionStore } from '../stores/useMissionStore';

interface RoverTraverseProps {
  visible: boolean;
}

export const RoverTraverse: React.FC<RoverTraverseProps> = ({ visible }) => {
  const { missionPlan, isPlaying, roverNodeIndex, setRoverNodeIndex, animSpeed } = useMissionStore();
  const roverGroupRef = useRef<THREE.Group>(null);
  const accumTimeRef = useRef<number>(0);

  // Map 128x128 grid coordinates to 3D surface space relative to terrain mesh
  const pathCoords = useMemo(() => {
    if (!missionPlan || !missionPlan.path || missionPlan.path.length === 0) return [];
    
    return missionPlan.path.map(([gx, gy]) => {
      const x = ((gx - 64) / 64) * 10.0;
      const z = ((gy - 64) / 64) * 10.0;
      const r = Math.sqrt(x * x + z * z);
      
      let y = 0.0;
      if (r < 5.0) {
        y = -2.5 * (1.0 - (r / 5.0) ** 2);
      } else if (r >= 5.0 && r < 6.5) {
        y = 0.6 * Math.exp(-Math.pow((r - 5.0) / 0.75, 2));
      } else {
        y = 0.2 * Math.sin(x * 0.5) * Math.cos(z * 0.5);
      }
      return new THREE.Vector3(x, y + 0.22, z);
    });
  }, [missionPlan]);

  // Render 3D Path Line Geometry
  const pathGeometry = useMemo(() => {
    if (pathCoords.length < 2) return null;
    return new THREE.BufferGeometry().setFromPoints(pathCoords);
  }, [pathCoords]);

  const pathLineObject = useMemo(() => {
    if (!pathGeometry) return null;
    const mat = new THREE.LineBasicMaterial({ color: '#10b981', linewidth: 4 });
    return new THREE.Line(pathGeometry, mat);
  }, [pathGeometry]);

  // Smooth interpolation along path
  useFrame((_, delta) => {
    if (!visible || pathCoords.length === 0 || !roverGroupRef.current) return;

    if (!isPlaying) {
      const curr = pathCoords[Math.min(roverNodeIndex, pathCoords.length - 1)];
      if (curr) {
        roverGroupRef.current.position.copy(curr);
      }
      return;
    }

    accumTimeRef.current += delta * animSpeed * 2.5;
    if (accumTimeRef.current >= 1.0) {
      accumTimeRef.current = 0.0;
      if (roverNodeIndex < pathCoords.length - 1) {
        setRoverNodeIndex(roverNodeIndex + 1);
      } else {
        useMissionStore.getState().setIsPlaying(false);
        return;
      }
    }

    const curr = pathCoords[roverNodeIndex];
    const next = pathCoords[Math.min(roverNodeIndex + 1, pathCoords.length - 1)];

    if (curr && next) {
      const interpolated = new THREE.Vector3().lerpVectors(curr, next, accumTimeRef.current);
      roverGroupRef.current.position.copy(interpolated);

      if (!curr.equals(next)) {
        const lookTarget = new THREE.Vector3(next.x, interpolated.y, next.z);
        roverGroupRef.current.lookAt(lookTarget);
      }
    }
  });

  if (!visible || pathCoords.length === 0) return null;

  return (
    <group position={[0, -0.35, 0]}>
      {/* Traversal Path Line */}
      {pathLineObject && <primitive object={pathLineObject} />}

      {/* Start Pin */}
      {pathCoords[0] && (
        <group position={pathCoords[0]}>
          <mesh position={[0, 0.2, 0]}>
            <sphereGeometry args={[0.22, 16, 16]} />
            <meshBasicMaterial color="#38bdf8" />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
            <ringGeometry args={[0.25, 0.35, 16]} />
            <meshBasicMaterial color="#38bdf8" transparent opacity={0.8} />
          </mesh>
        </group>
      )}

      {/* Target Pin */}
      {pathCoords[pathCoords.length - 1] && (
        <group position={pathCoords[pathCoords.length - 1]}>
          <mesh position={[0, 0.25, 0]}>
            <sphereGeometry args={[0.28, 16, 16]} />
            <meshBasicMaterial color="#f43f5e" />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
            <ringGeometry args={[0.3, 0.45, 16]} />
            <meshBasicMaterial color="#f43f5e" transparent opacity={0.8} />
          </mesh>
        </group>
      )}

      {/* High-Visibility 3D Rover Autonomous Asset */}
      <group ref={roverGroupRef} scale={[1.35, 1.35, 1.35]}>
        {/* Ground Contact Position Beacon Ring */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
          <ringGeometry args={[0.38, 0.52, 32]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.85} side={THREE.DoubleSide} />
        </mesh>

        {/* Chassis Main Frame */}
        <mesh position={[0, 0.18, 0]}>
          <boxGeometry args={[0.55, 0.22, 0.7]} />
          <meshStandardMaterial color="#ffffff" metalness={0.4} roughness={0.2} emissive="#0ea5e9" emissiveIntensity={0.15} />
        </mesh>

        {/* Golden MLI Insulation Base Foil */}
        <mesh position={[0, 0.07, 0]}>
          <boxGeometry args={[0.58, 0.04, 0.72]} />
          <meshStandardMaterial color="#d97706" metalness={0.9} roughness={0.1} />
        </mesh>

        {/* Deep Blue Solar Panel Array */}
        <mesh position={[0, 0.31, 0]}>
          <boxGeometry args={[0.85, 0.03, 0.55]} />
          <meshStandardMaterial color="#1d4ed8" roughness={0.1} metalness={0.8} />
        </mesh>

        {/* Sensor Mast Rod */}
        <mesh position={[0, 0.45, 0.2]}>
          <cylinderGeometry args={[0.025, 0.025, 0.26, 8]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.7} />
        </mesh>

        {/* Dual Stereoscopic NavCam Box */}
        <mesh position={[0, 0.58, 0.22]}>
          <boxGeometry args={[0.16, 0.08, 0.08]} />
          <meshStandardMaterial color="#0284c7" />
        </mesh>

        {/* High-Visibility Top LED Beacon Light */}
        <mesh position={[0, 0.68, 0.22]}>
          <sphereGeometry args={[0.07, 16, 16]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
        <pointLight position={[0, 0.75, 0.22]} intensity={3.5} distance={6} color="#38bdf8" />

        {/* 6 Rugged All-Terrain Wheels */}
        {[
          [-0.32, 0.08, 0.25],
          [0.32, 0.08, 0.25],
          [-0.32, 0.08, 0],
          [0.32, 0.08, 0],
          [-0.32, 0.08, -0.25],
          [0.32, 0.08, -0.25],
        ].map((wPos, idx) => (
          <mesh key={idx} position={wPos as [number, number, number]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.1, 0.1, 0.08, 16]} />
            <meshStandardMaterial color="#0f172a" roughness={0.6} />
          </mesh>
        ))}

        {/* Telemetry HTML Overlay Badge */}
        <Html position={[0, 0.95, 0]} center distanceFactor={11}>
          <div className="bg-[#0f172a] text-[#38bdf8] border border-[#38bdf8]/60 px-2.5 py-1 rounded text-[11px] font-mono font-extrabold whitespace-nowrap shadow-2xl flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-[#38bdf8] animate-ping" />
            <span>ROVER-1 • WAYPOINT {roverNodeIndex + 1}/{pathCoords.length}</span>
          </div>
        </Html>
      </group>
    </group>
  );
};
