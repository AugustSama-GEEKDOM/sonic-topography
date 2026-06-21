import { useFrame, extend, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useRef, useMemo, useLayoutEffect, useEffect } from 'react';
import { MapShaderMaterial } from './CustomShaderMaterial';
import { engine } from '../../lib/AudioEngine';
import { themes } from '../../lib/themes';
import { userSettings } from '../../lib/UserSettings';

extend({ MapShaderMaterial });

export function MapScene({ theme = 'nocturnal' }: { theme?: string }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const materialRef = useRef<any>(null);
  const { clock } = useThree();
  
  const gridSize = 160;
  const spacing = 1.05;
  const count = gridSize * gridSize;

  useLayoutEffect(() => {
    if (!meshRef.current) return;
    const tempMatrix = new THREE.Matrix4();
    const offset = (gridSize * spacing) / 2;

    let i = 0;
    for (let x = 0; x < gridSize; x++) {
      for (let z = 0; z < gridSize; z++) {
        const px = x * spacing - offset;
        const pz = z * spacing - offset;
        tempMatrix.makeTranslation(px, 0.5, pz);
        meshRef.current.setMatrixAt(i, tempMatrix);
        i++;
      }
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [gridSize, spacing]);

  // Ripples logic
  // We keep a ring buffer of 10 ripples
  const ripplesRef = useRef(new Array(10).fill(null).map(() => ({
    pos: new THREE.Vector2(),
    time: -100,
    strength: 0,
    isActive: 0
  })));
  const rippleIndex = useRef(0);

  const addRipple = (x: number, y: number, strength: number, isWhite: boolean = false) => {
    const idx = rippleIndex.current;
    ripplesRef.current[idx] = {
      pos: new THREE.Vector2(x, y),
      time: clock.getElapsedTime(),
      strength,
      isActive: 1,
      rippleType: isWhite ? 1 : 0
    } as any;
    rippleIndex.current = (idx + 1) % 10;
  };

  const fogRef = useRef<THREE.Fog>(null);
  
  // Meteors logic
  const MAX_METEORS = 20;
  const meteorMeshRef = useRef<THREE.InstancedMesh>(null);
  const meteorMatRef = useRef<THREE.MeshBasicMaterial>(null);
  
  // Particles for meteor trails
  const MAX_PARTICLES = 200;
  const particleMeshRef = useRef<THREE.InstancedMesh>(null);
  const particleMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const particlesRef = useRef(new Array(MAX_PARTICLES).fill(null).map(() => ({
    active: false,
    x: 0, y: -1000, z: 0,
    vx: 0, vy: 0, vz: 0,
    life: 0, maxLife: 1, scale: 1
  })));
  const particleIndex = useRef(0);
  const spawnParticle = (x: number, y: number, z: number, speedMultiplier: number) => {
     const idx = particleIndex.current;
     const p = particlesRef.current[idx];
     p.active = true;
     p.x = x + (Math.random() - 0.5) * 1.5;
     p.y = y + (Math.random() - 0.5) * 1.5;
     p.z = z + (Math.random() - 0.5) * 1.5;
     p.vx = (Math.random() - 0.5) * 2.0;
     p.vy = Math.random() * 2.0 + speedMultiplier * 10.0;
     p.vz = (Math.random() - 0.5) * 2.0;
     p.life = 0;
     p.maxLife = 0.5 + Math.random() * 0.5;
     p.scale = Math.random() * 0.6 + 0.2;
     particleIndex.current = (idx + 1) % MAX_PARTICLES;
  };
  
  const dummyMatrix = useMemo(() => new THREE.Matrix4(), []);
  const dummyPosition = useMemo(() => new THREE.Vector3(), []);
  const dummyRotation = useMemo(() => new THREE.Quaternion(), []);
  const dummyScale = useMemo(() => new THREE.Vector3(), []);
  
  const meteorsRef = useRef(new Array(MAX_METEORS).fill(null).map(() => ({
    active: false,
    x: 0,
    y: -1000,
    z: 0,
    speed: 0,
    strength: 0,
  })));
  const meteorIndex = useRef(0);
  const lastMeteorSpawnTime = useRef(-Infinity);

  const addMeteor = (strength: number) => {
     const now = clock.getElapsedTime();
     const cooldownSeconds = engine.meteorTrigger.cooldown / 60;
     if (now - lastMeteorSpawnTime.current < cooldownSeconds) return;
     lastMeteorSpawnTime.current = now;

     const idx = meteorIndex.current;
     const angle = Math.random() * Math.PI * 2;
     const dist = Math.random() * 25;
     
     const m = meteorsRef.current[idx];
     m.active = true;
     m.x = Math.cos(angle) * dist;
     m.z = Math.sin(angle) * dist;
     m.y = 30 + Math.random() * 10;
     m.speed = 1.0 + Math.random() * 0.5 + (strength * 1.5);
     m.strength = strength;
     
     meteorIndex.current = (idx + 1) % MAX_METEORS;
  };
  
  // Wire up audio engine beat detection
  useEffect(() => {
    engine.onFreqTrigger = (strength, mode, action) => {
       if (action === 'Meteor') {
          addMeteor(strength);
       } else {
          const angle = Math.random() * Math.PI * 2;
          if (mode === 'Kick') {
             const dist = Math.random() * 25; // Random position, can be near center or further out
             const rx = Math.cos(angle) * dist;
             const rz = Math.sin(angle) * dist;
             addRipple(rx, rz, Math.min(strength * 3.0, 4.0));
          } 
          else {
             const dist = 10 + Math.random() * 25; 
             const rx = Math.cos(angle) * dist;
             const rz = Math.sin(angle) * dist;
             addRipple(rx, rz, Math.min(strength * 3.0, 3.0));
          }
       }
    };
  }, [theme]);

  // ── Mouse-following camera ──
  const { camera } = useThree();
  const mouseRef = useRef({ x: 0, y: 0 });
  const cameraCenter = useMemo(() => new THREE.Vector3(0, 0, 0), []);

  // Base spherical coords (matches original camera [35, 25, 35])
  const baseAzimuth = useMemo(() => Math.atan2(35, 35), []);   // ≈ π/4
  const basePolar = useMemo(() => Math.acos(25 / Math.sqrt(35 * 35 + 25 * 25 + 35 * 35)), []); // ≈ 1.1 rad
  const baseDistance = useMemo(() => Math.sqrt(35 * 35 + 25 * 25 + 35 * 35), []); // ≈ 45

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Normalize to [-1, 1], Y inverted so that mouse-up → look-from-above
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useFrame((state, delta) => {
    if (!materialRef.current) return;
    const mat = materialRef.current;
    const data = engine.getAudioData();
    const t = themes[theme] || themes['nocturnal'];

    // Smoothly transition colors
    const lerpSpeed = 3.0 * delta;
    mat.uBaseColor1.lerp(t.uBaseColor1, lerpSpeed);
    mat.uBaseColor2.lerp(t.uBaseColor2, lerpSpeed);
    mat.uCoolCore.lerp(t.uCoolCore, lerpSpeed);
    mat.uCoolEdge.lerp(t.uCoolEdge, lerpSpeed);
    mat.uWarmCore.lerp(t.uWarmCore, lerpSpeed);
    mat.uWarmEdge.lerp(t.uWarmEdge, lerpSpeed);
    mat.uRippleColor.lerp(t.uRippleColor, lerpSpeed);
    mat.uGlowIntensity = THREE.MathUtils.lerp(mat.uGlowIntensity, t.uGlowIntensity * userSettings.glowintensity, lerpSpeed);

    if (fogRef.current) {
        fogRef.current.color.lerp(t.uBaseColor1, lerpSpeed);
    }

    mat.uTime = state.clock.getElapsedTime();

    // ── Audio sensitivity multiplier (user-customisable slider) ──
    const sens = userSettings.audiosensitivity;

    mat.uBass = data.bass * sens;
    mat.uMid = data.mid * sens;
    mat.uTreble = data.treble * sens;
    mat.uEnergy = data.energy * sens;
    
    mat.uSubBass = data.subBass * sens;
    mat.uLowMid = data.lowMid * sens;
    mat.uHighMid = data.highMid * sens;
    mat.uPresence = data.presence * sens;
    mat.uBrilliance = data.brilliance * sens;
    mat.uAir = data.air * sens;

    mat.uWarmth = data.warmth * sens;
    mat.uBrightness = data.brightness * sens;
    mat.uSharpness = data.sharpness * sens;
    mat.uSmoothness = data.smoothness * sens;
    mat.uDensity = data.density * sens;
    mat.uSpectralCentroid = data.spectralCentroid * sens;
    
    // Pass ripples
    mat.uRipples = ripplesRef.current;

    // Update meteors
    if (meteorMeshRef.current) {
        
        if (meteorMatRef.current) {
            const mColor = new THREE.Color().copy(t.uWarmCore).lerp(new THREE.Color(0xffffff), 0.7);
            meteorMatRef.current.color.lerp(mColor, lerpSpeed);
        }

        for (let i = 0; i < MAX_METEORS; i++) {
            const m = meteorsRef.current[i];
            if (!m.active) {
                dummyPosition.set(0, -1000, 0);
                dummyScale.set(0, 0, 0);
                dummyMatrix.compose(dummyPosition, dummyRotation, dummyScale);
                meteorMeshRef.current.setMatrixAt(i, dummyMatrix);
            } else {
                m.y -= m.speed * 60 * delta; // falling translation (faster)
                if (m.y <= 0) {
                    m.active = false;
                    addRipple(m.x, m.z, Math.min(m.strength * 1.0, 1.2), true); // miniature white wave impact
                    // Impact particles
                    for (let pIndex = 0; pIndex < 10; pIndex++) spawnParticle(m.x, 0.5, m.z, m.speed * 1.5);
                }
                dummyPosition.set(m.x, Math.max(0, m.y), m.z);
                dummyScale.set(1.5, 1.5, 1.5);
                dummyMatrix.compose(dummyPosition, dummyRotation, dummyScale);
                meteorMeshRef.current.setMatrixAt(i, dummyMatrix);
                
                if (m.y > 0 && Math.random() > 0.3) {
                   spawnParticle(m.x, m.y, m.z, m.speed * 0.2); // trail
                }
            }
        }
        meteorMeshRef.current.instanceMatrix.needsUpdate = true;
    }
    
    // Update particles
    if (particleMeshRef.current) {
        if (particleMatRef.current) particleMatRef.current.color.copy(meteorMatRef.current ? meteorMatRef.current.color : new THREE.Color(0xffffff));
        
        for (let i = 0; i < MAX_PARTICLES; i++) {
           const p = particlesRef.current[i];
           if (!p.active) {
                dummyPosition.set(0, -1000, 0);
                dummyScale.set(0, 0, 0);
                dummyMatrix.compose(dummyPosition, dummyRotation, dummyScale);
                particleMeshRef.current.setMatrixAt(i, dummyMatrix);
           } else {
                p.life += delta;
                if (p.life >= p.maxLife) {
                    p.active = false;
                    dummyScale.set(0, 0, 0);
                } else {
                    p.x += p.vx * delta * 10;
                    p.y += p.vy * delta * 10;
                    p.z += p.vz * delta * 10;
                    const s = p.scale * (1.0 - (p.life / p.maxLife));
                    dummyPosition.set(p.x, p.y, p.z);
                    dummyScale.set(s, s, s);
                }
                dummyMatrix.compose(dummyPosition, dummyRotation, dummyScale);
                particleMeshRef.current.setMatrixAt(i, dummyMatrix);
           }
        }
        particleMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    // ── Mouse-driven camera orbit ──
    const mx = mouseRef.current.x;
    const my = mouseRef.current.y;
    const zoom = userSettings.zoomlevel;

    // Map mouse X → azimuth swing  ±0.5 rad, mouse Y → polar tilt ±0.25 rad
    const targetAzimuth = baseAzimuth + mx * 0.5;
    const targetPolar = basePolar - my * 0.25;
    const targetDistance = (baseDistance - my * 5) / zoom; // zoom: larger=closer

    // Clamp polar so we don't flip under the plane
    const clampedPolar = THREE.MathUtils.clamp(targetPolar, 0.3, Math.PI / 2 - 0.05);
    const clampedDistance = THREE.MathUtils.clamp(targetDistance, 6, 180);

    // Square the mouse offset for a nonlinear feel near center (dead-zone effect)
    const offsetMag = Math.sqrt(mx * mx + my * my);
    const lerpFactor = 1.5 * delta * (0.2 + offsetMag * 0.8) * userSettings.camerasensitivity;

    const curDir = camera.position.clone().sub(cameraCenter);
    const curDist = curDir.length();
    const curAzimuth = Math.atan2(curDir.x, curDir.z);
    const curPolar = Math.acos(curDir.y / Math.max(curDist, 0.001));

    const newAzimuth = THREE.MathUtils.lerp(curAzimuth, targetAzimuth, lerpFactor);
    const newPolar = THREE.MathUtils.lerp(curPolar, clampedPolar, lerpFactor);
    const newDist = THREE.MathUtils.lerp(curDist, clampedDistance, lerpFactor);

    const nx = newDist * Math.sin(newPolar) * Math.sin(newAzimuth);
    const ny = newDist * Math.cos(newPolar);
    const nz = newDist * Math.sin(newPolar) * Math.cos(newAzimuth);

    camera.position.set(nx, ny, nz);
    camera.lookAt(cameraCenter);
  });

  const t = themes[theme] || themes['nocturnal'];

  return (
    <>
      <fog ref={fogRef} attach="fog" args={[`#${t.uBaseColor1.getHexString()}`, 30, 95]} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 20, 10]} intensity={1} />

      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, count]}
      >
        <boxGeometry args={[0.9, 1, 0.9]} />
        {/* @ts-ignore */}
        <mapShaderMaterial ref={materialRef} transparent={true} />
      </instancedMesh>

      <instancedMesh ref={meteorMeshRef} args={[undefined as any, undefined as any, MAX_METEORS]} frustumCulled={false}>
         <boxGeometry args={[0.4, 1.2, 0.4]} />
         <meshBasicMaterial ref={meteorMatRef} color="#ffffff" toneMapped={false} /> 
      </instancedMesh>

      <instancedMesh ref={particleMeshRef} args={[undefined as any, undefined as any, MAX_PARTICLES]} frustumCulled={false}>
         <boxGeometry args={[0.8, 0.8, 0.8]} />
         <meshBasicMaterial ref={particleMatRef} color="#ffffff" toneMapped={false} transparent={true} opacity={0.6} /> 
      </instancedMesh>
    </>
  );
}
