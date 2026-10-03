import React, { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Html, Line, Stars } from '@react-three/drei'
import * as THREE from 'three'
import { DEPLOY_STAGES } from '../Motion/deployStages'

const PACKETS = 5
const SPEED = 0.06 // path fractions per second → one full commit→live trip ≈ 16 s

const Mat: React.FC<{ color: string; intensity?: number; wire?: boolean }> = ({ color, intensity = 0.55, wire }) => (
  <meshStandardMaterial color={color} emissive={color} emissiveIntensity={intensity} roughness={0.3} metalness={0.6} wireframe={wire} />
)

/* ---------- one small 3D model per tool ---------- */
const GitShape: React.FC<{ color: string }> = ({ color }) => (
  <group>
    <mesh><octahedronGeometry args={[0.38]} /><Mat color={color} /></mesh>
    <mesh position={[0.55, 0.35, 0]}><sphereGeometry args={[0.13, 16, 16]} /><Mat color="#a3e635" /></mesh>
    <mesh position={[0.55, -0.35, 0]}><sphereGeometry args={[0.13, 16, 16]} /><Mat color="#ec4899" /></mesh>
  </group>
)

const CiShape: React.FC<{ color: string }> = ({ color }) => {
  const gear = useRef<THREE.Group>(null)
  useFrame((_, dt) => { if (gear.current) gear.current.rotation.z += dt * 0.9 })
  return (
    <group ref={gear} rotation={[Math.PI / 2.4, 0, 0]}>
      <mesh><torusGeometry args={[0.38, 0.12, 12, 8]} /><Mat color={color} /></mesh>
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={i} position={[Math.cos((i / 8) * Math.PI * 2) * 0.55, Math.sin((i / 8) * Math.PI * 2) * 0.55, 0]}>
          <boxGeometry args={[0.16, 0.16, 0.2]} /><Mat color={color} />
        </mesh>
      ))}
    </group>
  )
}

const DockerShape: React.FC<{ color: string }> = ({ color }) => (
  <group>
    {[0, 1, 2].map((r) => [0, 1, 2].slice(0, 3 - r).map((c) => (
      <mesh key={`${r}-${c}`} position={[c * 0.36 - (2 - r) * 0.18, r * 0.3 - 0.2, 0]}>
        <boxGeometry args={[0.32, 0.26, 0.4]} /><Mat color={color} intensity={0.5} />
      </mesh>
    )))}
  </group>
)

const RegistryShape: React.FC<{ color: string }> = ({ color }) => (
  <group>
    {[-0.3, 0, 0.3].map((y, i) => (
      <mesh key={i} position={[0, y, 0]}><cylinderGeometry args={[0.38, 0.38, 0.22, 24]} /><Mat color={color} intensity={0.35 + i * 0.15} /></mesh>
    ))}
  </group>
)

const TerraformShape: React.FC<{ color: string }> = ({ color }) => {
  const g = useRef<THREE.Group>(null)
  useFrame((_, dt) => { if (g.current) g.current.rotation.y += dt * 0.5 })
  return (
    <group ref={g}>
      {[-0.28, 0, 0.28].map((y, i) => (
        <mesh key={i} position={[0, y, 0]} rotation={[0, Math.PI / 4, 0]}><boxGeometry args={[0.7 - i * 0.08, 0.1, 0.7 - i * 0.08]} /><Mat color={color} intensity={0.4 + i * 0.2} /></mesh>
      ))}
    </group>
  )
}

const K8sShape: React.FC<{ color: string }> = ({ color }) => {
  const ring = useRef<THREE.Group>(null)
  useFrame((_, dt) => { if (ring.current) ring.current.rotation.z -= dt * 0.7 })
  return (
    <group rotation={[0.9, 0, 0]}>
      <mesh><dodecahedronGeometry args={[0.2]} /><Mat color={color} /></mesh>
      <group ref={ring}>
        {Array.from({ length: 7 }).map((_, i) => (
          <mesh key={i} position={[Math.cos((i / 7) * Math.PI * 2) * 0.55, Math.sin((i / 7) * Math.PI * 2) * 0.55, 0]}>
            <sphereGeometry args={[0.1, 14, 14]} /><Mat color="#93c5fd" />
          </mesh>
        ))}
      </group>
    </group>
  )
}

const ServerShape: React.FC<{ color: string }> = ({ color }) => {
  const leds = useRef<THREE.Mesh[]>([])
  const ripple = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    leds.current.forEach((m, i) => { if (m) (m.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.4 + 0.9 * Math.max(0, Math.sin(t * 5 + i * 1.7)) })
    if (ripple.current) {
      const p = (t * 0.6) % 1
      ripple.current.scale.setScalar(1 + p * 2.2)
      ;(ripple.current.material as THREE.MeshBasicMaterial).opacity = 0.85 * (1 - p)
    }
  })
  return (
    <group>
      <mesh><boxGeometry args={[0.8, 1.0, 0.6]} /><meshStandardMaterial color="#64748b" emissive="#0f766e" emissiveIntensity={0.25} roughness={0.35} metalness={0.8} /></mesh>
      <mesh position={[0, 0.54, 0]}><boxGeometry args={[0.84, 0.05, 0.64]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.9} /></mesh>
      <pointLight color={color} intensity={5} distance={3} position={[0, 0, 1]} />
      {[0.3, 0.1, -0.1, -0.3].map((y, i) => (
        <mesh key={i} position={[0, y, 0.285]}><boxGeometry args={[0.66, 0.1, 0.02]} /><meshStandardMaterial color="#1e293b" /></mesh>
      ))}
      {[0.3, 0.1, -0.1, -0.3].map((y, i) => (
        <mesh key={`l${i}`} position={[0.27, y, 0.3]} ref={(m) => { if (m) leds.current[i] = m }}>
          <sphereGeometry args={[0.045, 10, 10]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} />
        </mesh>
      ))}
      <mesh ref={ripple} position={[0, -0.55, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.55, 0.62, 48]} /><meshBasicMaterial color={color} transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

const SHAPES: Record<string, React.FC<{ color: string }>> = {
  git: GitShape, ci: CiShape, docker: DockerShape, registry: RegistryShape, terraform: TerraformShape, k8s: K8sShape, server: ServerShape,
}

/* ---------- the animated pipeline ---------- */
const Pipeline: React.FC = () => {
  const root = useRef<THREE.Group>(null)
  const stageRefs = useRef<(THREE.Group | null)[]>([])
  const packetRefs = useRef<(THREE.Mesh | null)[]>([])

  const { curve, points, stageT, colors } = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(DEPLOY_STAGES.map((s) => new THREE.Vector3(...s.pos)), false, 'catmullrom', 0.35)
    const samples = curve.getSpacedPoints(600)
    const stageT = DEPLOY_STAGES.map((s) => {
      const p = new THREE.Vector3(...s.pos)
      let best = 0, bd = Infinity
      samples.forEach((q, i) => { const d = q.distanceToSquared(p); if (d < bd) { bd = d; best = i } })
      return best / 600
    })
    return { curve, points: curve.getPoints(160).map((v) => v.toArray() as [number, number, number]), stageT, colors: DEPLOY_STAGES.map((s) => new THREE.Color(s.color)) }
  }, [])

  const tmp = useMemo(() => new THREE.Color(), [])

  useFrame(({ clock, pointer }, dt) => {
    const time = clock.elapsedTime
    if (root.current) {
      // isometric tilt + gentle pointer parallax
      root.current.rotation.y = THREE.MathUtils.lerp(root.current.rotation.y, -0.42 + pointer.x * 0.18, 0.05)
      root.current.rotation.x = THREE.MathUtils.lerp(root.current.rotation.x, 0.12 - pointer.y * 0.06, 0.05)
    }
    const ts: number[] = []
    for (let i = 0; i < PACKETS; i++) {
      const t = (time * SPEED + i / PACKETS) % 1
      ts.push(t)
      const m = packetRefs.current[i]
      if (!m) continue
      m.position.copy(curve.getPointAt(t))
      // colour follows the artifact: code → build → image → live
      let seg = 0
      while (seg < stageT.length - 2 && t > stageT[seg + 1]) seg++
      const span = Math.max(stageT[seg + 1] - stageT[seg], 1e-4)
      tmp.copy(colors[seg]).lerp(colors[seg + 1], THREE.MathUtils.clamp((t - stageT[seg]) / span, 0, 1))
      const mat = m.material as THREE.MeshStandardMaterial
      mat.color.copy(tmp); mat.emissive.copy(tmp)
      m.rotation.x += dt * 2; m.rotation.y += dt * 2.4
    }
    // stage "wakes up" when a packet passes through it
    stageRefs.current.forEach((g, i) => {
      if (!g) return
      let pulse = 0
      for (const t of ts) { const d = Math.abs(t - stageT[i]); pulse = Math.max(pulse, 1 - d / 0.05) }
      const s = 1 + Math.max(0, pulse) * 0.28
      g.scale.setScalar(THREE.MathUtils.lerp(g.scale.x, s, 0.2))
    })
  })

  return (
    <group ref={root} scale={0.95}>
      <Line points={points} color="#22d3ee" lineWidth={2} transparent opacity={0.45} />
      <Line points={points} color="#8b5cf6" lineWidth={0.6} transparent opacity={0.5} dashed dashSize={0.12} gapSize={0.14} />

      {DEPLOY_STAGES.map((s, i) => {
        const Shape = SHAPES[s.key]
        return (
          <group key={s.key} position={s.pos}>
            <group ref={(g) => { stageRefs.current[i] = g }}>
              <Shape color={s.color} />
            </group>
            <Html position={[s.pos[0] > 0 ? -0.95 : 0.95, s.key === 'server' ? -0.45 : 0, 0]} style={{ pointerEvents: 'none' }} zIndexRange={[10, 0]}>
              <div style={s.pos[0] > 0 ? { transform: 'translateX(-100%)' } : undefined} className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white/85 dark:bg-ink-900/80 backdrop-blur-md shadow-lg whitespace-nowrap select-none">
                <span className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${s.color}26` }}>
                  <s.icon className="w-4 h-4" style={{ color: s.color }} />
                </span>
                <span className="leading-tight">
                  <span className="block text-[13px] font-semibold text-slate-900 dark:text-white">{s.tool}</span>
                  <span className="block text-[11px] text-slate-500 dark:text-gray-400">{i + 1}. {s.note}</span>
                </span>
              </div>
            </Html>
          </group>
        )
      })}

      {Array.from({ length: PACKETS }).map((_, i) => (
        <mesh key={i} ref={(m) => { packetRefs.current[i] = m }}>
          <boxGeometry args={[0.16, 0.16, 0.16]} />
          <meshStandardMaterial color="#e2e8f0" emissive="#e2e8f0" emissiveIntensity={1.4} />
        </mesh>
      ))}
    </group>
  )
}

const DeployFlowScene: React.FC<{ dark?: boolean }> = ({ dark = true }) => (
  <Canvas camera={{ position: [0, 0, 11.5], fov: 45 }} dpr={[1, 1.75]} gl={{ antialias: true, alpha: true }}>
    <ambientLight intensity={dark ? 0.55 : 0.9} />
    <pointLight position={[5, 5, 6]} intensity={45} color="#22d3ee" />
    <pointLight position={[-5, -3, 5]} intensity={35} color="#8b5cf6" />
    {dark && <Stars radius={50} depth={30} count={1200} factor={3} fade speed={0.5} />}
    <Pipeline />
  </Canvas>
)

export default DeployFlowScene
