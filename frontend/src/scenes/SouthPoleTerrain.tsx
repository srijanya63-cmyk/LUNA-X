import React, { useMemo, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { ThreeEvent } from '@react-three/fiber';
import { OverlayLayer, useUIStore, TerrainAnalysisData } from '../stores/useUIStore';
import { useMissionStore } from '../stores/useMissionStore';

interface SouthPoleTerrainProps {
  visible: boolean;
  activeLayer: OverlayLayer;
}


export const SouthPoleTerrain: React.FC<SouthPoleTerrainProps> = ({ visible, activeLayer }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const clickedTerrainPoint = useUIStore((s) => s.clickedTerrainPoint);
  const setClickedTerrainPoint = useUIStore((s) => s.setClickedTerrainPoint);

  const gridSize = 128;
  const terrainWidth = 20;

  // Generate 3D Plane Geometry displacement matching Shackleton crater morphology
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(terrainWidth, terrainWidth, gridSize - 1, gridSize - 1);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const r = Math.sqrt(x * x + z * z);

      // Crater bowl (depth ~ 2.5 units inside r < 5.0)
      let height = 0.0;
      if (r < 5.0) {
        height = -2.5 * (1.0 - (r / 5.0) ** 2);
      } else if (r >= 5.0 && r < 6.5) {
        // Crater rim height (+0.6 units)
        height = 0.6 * Math.exp(-Math.pow((r - 5.0) / 0.75, 2));
      } else {
        // Outer undulating ejecta plain
        height = 0.2 * Math.sin(x * 0.5) * Math.cos(z * 0.5);
      }

      pos.setY(i, height);
    }

    geo.computeVertexNormals();
    return geo;
  }, []);

  // Generate dynamic 2D canvas texture for scientific heatmap layers
  const heatmapTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    const imgData = ctx.createImageData(256, 256);
    const data = imgData.data;

    for (let py = 0; py < 256; py++) {
      for (let px = 0; px < 256; px++) {
        const nx = ((px - 128) / 128) * 10;
        const ny = ((py - 128) / 128) * 10;
        const r = Math.sqrt(nx * nx + ny * ny);
        const idx = (py * 256 + px) * 4;

        let red = 40,
          green = 45,
          blue = 55,
          alpha = 255;

        if (activeLayer === 'ice_likelihood') {
          if (r < 4.0) {
            const val = 1.0 - r / 4.0;
            red = Math.floor(10 + val * 40);
            green = Math.floor(180 + val * 75);
            blue = Math.floor(220 + val * 35);
          } else {
            red = 30;
            green = 35;
            blue = 45;
          }
        } else if (activeLayer === 'hazard') {
          if (r >= 4.5 && r <= 5.5) {
            red = 240;
            green = 60;
            blue = 60;
          } else {
            red = 40;
            green = 120;
            blue = 60;
          }
        } else if (activeLayer === 'confidence') {
          const val = Math.sin(px * 0.05) * 0.3 + 0.7;
          red = Math.floor(220 * val);
          green = Math.floor(200 * val);
          blue = Math.floor(80 * val);
        } else if (activeLayer === 'slope') {
          if (r >= 4.5 && r <= 5.8) {
            red = 230;
            green = 150;
            blue = 40;
          } else {
            red = 50;
            green = 160;
            blue = 80;
          }
        }

        data[idx] = red;
        data[idx + 1] = green;
        data[idx + 2] = blue;
        data[idx + 3] = alpha;
      }
    }

    ctx.putImageData(imgData, 0, 0);
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, [activeLayer]);

  const humanRoute = useMissionStore((s: any) => s.humanRoute);
  const humanRoute3DPoints = useMemo(() => {
    if (!humanRoute || !humanRoute.points || humanRoute.points.length < 2) return [];
    return humanRoute.points.map(([gx, gy]: [number, number]) => {
      const x = (gx / 128) * 20 - 10;
      const z = (gy / 128) * 20 - 10;
      return new THREE.Vector3(x, 0.25, z);
    });
  }, [humanRoute]);

  if (!visible) return null;

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const pt = e.point;

    const gx = Math.max(0, Math.min(127, Math.floor(((pt.x + 10) / 20) * 128)));
    const gy = Math.max(0, Math.min(127, Math.floor(((pt.z + 10) / 20) * 128)));

    // Handle Human Route Drawing
    const isDrawingHumanRoute = useMissionStore.getState().isDrawingHumanRoute;
    if (isDrawingHumanRoute) {
      useMissionStore.getState().addHumanWaypoint([gx, gy]);
      useUIStore.getState().setNotification('info', `Human Waypoint added: [${gx}, ${gy}]`);
      return;
    }

    const r = Math.sqrt(pt.x * pt.x + pt.z * pt.z);

    const elevation = Math.round(-2000 + pt.y * 350);
    const slope = Number((Math.abs(pt.y) * 8.5 + (r > 4.5 && r < 6.0 ? 16.5 : 4.2)).toFixed(1));
    const hazard: 'LOW' | 'MODERATE' | 'HIGH' = slope > 15 ? 'HIGH' : slope > 10 ? 'MODERATE' : 'LOW';
    const illumination = r > 4.5 ? Math.round(82 + Math.sin(pt.x) * 8) : 14;
    const ice = r < 4.5 ? Math.round(78 + Math.cos(pt.z) * 12) : 18;
    const accessibility = Math.max(10, Math.round(100 - slope * 3.5));

    const analysisData: TerrainAnalysisData = {
      grid_x: gx,
      grid_y: gy,
      world_pos: [pt.x, pt.y + 0.15, pt.z],
      elevation_m: elevation,
      slope_deg: slope,
      hazard_level: hazard,
      illumination_pct: illumination,
      ice_likelihood_pct: ice,
      confidence_pct: 85,
      accessibility_score: accessibility,
    };

    setClickedTerrainPoint(analysisData);
  };


  return (
    <group>
      <mesh
        ref={meshRef}
        geometry={geometry}
        receiveShadow
        castShadow
        onPointerDown={handlePointerDown}
      >
        <meshStandardMaterial
          map={heatmapTexture}
          roughness={0.85}
          metalness={0.1}
          wireframe={activeLayer === 'none'}
        />
      </mesh>

      {/* 3D Clicked Point Marker Pin */}
      {clickedTerrainPoint && (
        <group position={clickedTerrainPoint.world_pos}>
          <mesh position={[0, 0.4, 0]}>
            <cylinderGeometry args={[0.04, 0.01, 0.8, 8]} />
            <meshBasicMaterial color="#38bdf8" />
          </mesh>
          <mesh position={[0, 0.8, 0]}>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshBasicMaterial color="#0284c7" />
          </mesh>
          <ringGeometry args={[0.2, 0.3, 32]} />
        </group>
      )}

      {/* 3D Human Route Overlay Line */}
      {humanRoute3DPoints.length >= 2 && (
        <line>
          <bufferGeometry attach="geometry" onUpdate={(geo) => geo.setFromPoints(humanRoute3DPoints)} />
          <lineBasicMaterial attach="material" color="#f59e0b" linewidth={3} />
        </line>
      )}
    </group>
  );
};

