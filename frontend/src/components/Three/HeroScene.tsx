import React, { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, Line, Stars } from '@react-three/drei'
import * as THREE from 'three'

const NODE_COLORS = ['#22d3ee', '#8b5cf6', '#ec4899', '#a3e635', '#38bdf8']

/** Orbiting "infrastructure" nodes (cloud / container / pipeline) joined to a central core. */
const Cluster: React.FC = () => {
  const group = useRef<THREE.Group>(null)
  const core = useRef<THREE.Mesh>(null)

  const nodes = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => {
        const phi = Math.acos(1 - (2 * (i + 0.5)) / 14)
        const theta = Math.PI * (1 + Math.sqrt(5)) * i
        const r = 2.6 + (i % 3) * 0.25
        return {
          pos: new THREE.Vector3(r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta)),
          color: NODE_COLORS[i % NODE_COLORS.length],
          shape: i % 3,
        }
      }),
    []
  )

  useFrame((state, dt) => {
    if (group.current) {
      group.current.rotation.y += dt * 0.15
      // gentle pointer parallax
      group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, state.pointer.y * 0.25, 0.04)
      group.current.position.x = THREE.MathUtils.lerp(group.current.position.x, state.pointer.x * 0.4, 0.04)
    }
    if (core.current) core.current.rotation.y -= dt * 0.4
  })

  return (
    <group ref={group}>
      <mesh ref={core}>
        <icosahedronGeometry args={[1.2, 1]} />
        <meshStandardMaterial color="#0ea5e9" wireframe emissive="#22d3ee" emissiveIntensity={0.9} />
      </mesh>
      <mesh>
        <icosahedronGeometry args={[0.85, 2]} />
        <meshStandardMaterial color="#8b5cf6" emissive="#8b5cf6" emissiveIntensity={0.6} roughness={0.2} metalness={0.8} />
      </mesh>
      {nodes.map((n, i) => (
        <React.Fragment key={i}>
          <Line points={[[0, 0, 0], n.pos.toArray()]} color={n.color} lineWidth={0.6} transparent opacity={0.35} />
          <Float speed={1.5 + (i % 4) * 0.4} floatIntensity={0.6} rotationIntensity={1.2}>
            <mesh position={n.pos}>
              {n.shape === 0 ? <boxGeometry args={[0.38, 0.38, 0.38]} /> : n.shape === 1 ? <octahedronGeometry args={[0.28]} /> : <torusGeometry args={[0.2, 0.07, 12, 24]} />}
              <meshStandardMaterial color={n.color} emissive={n.color} emissiveIntensity={0.7} roughness={0.25} metalness={0.7} />
            </mesh>
          </Float>
        </React.Fragment>
      ))}
    </group>
  )
}

const HeroScene: React.FC = () => (
  <Canvas camera={{ position: [0, 0, 8], fov: 50 }} dpr={[1, 1.75]} gl={{ antialias: true, alpha: true }}>
    <ambientLight intensity={0.5} />
    <pointLight position={[6, 6, 6]} intensity={40} color="#22d3ee" />
    <pointLight position={[-6, -4, 4]} intensity={30} color="#8b5cf6" />
    <Stars radius={60} depth={40} count={1800} factor={3} fade speed={0.6} />
    <Cluster />
  </Canvas>
)

export default HeroScene
