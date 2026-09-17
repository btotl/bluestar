import { useEffect, useRef } from 'react'
import * as THREE from 'three'

interface Props {
  /** 0..1 Birth progress: lifts brightness and, past 1, fires the bloom. */
  intensity: number
  /** Fire a brief energy bloom (the sky remembers). */
  bloom?: boolean
  /** −1..1 parallax input. */
  tilt?: { x: number; y: number }
}

/**
 * Optional WebGL atmosphere: sparse stars at three depths, a slow camera
 * drift, a few dust motes, and one brief bloom. Transparent, behind the SVG,
 * never load-bearing. Pauses when the tab is hidden; one context; disposed
 * on unmount. Loaded lazily and only at the "full" quality level.
 */
export default function CelestialScene({ intensity, bloom = false, tilt }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)
  const state = useRef<{ stars: THREE.Points; motes: THREE.Points; bloom: THREE.Sprite; camera: THREE.PerspectiveCamera; renderer: THREE.WebGLRenderer } | null>(null)
  const intensityRef = useRef(intensity)
  const tiltRef = useRef(tilt ?? { x: 0, y: 0 })
  const bloomAt = useRef<number | null>(null)

  useEffect(() => {
    intensityRef.current = intensity
  }, [intensity])
  useEffect(() => {
    tiltRef.current = tilt ?? { x: 0, y: 0 }
  }, [tilt])

  useEffect(() => {
    if (bloom) bloomAt.current = performance.now()
  }, [bloom])

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'low-power' })
    } catch {
      return
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100)
    camera.position.z = 8

    const mkPoints = (count: number, spread: number, size: number, color: number, opacity: number) => {
      const geo = new THREE.BufferGeometry()
      const pos = new Float32Array(count * 3)
      for (let i = 0; i < count; i++) {
        pos[i * 3] = (Math.random() - 0.5) * spread
        pos[i * 3 + 1] = (Math.random() - 0.5) * spread
        pos[i * 3 + 2] = -Math.random() * 20
      }
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
      const mat = new THREE.PointsMaterial({ size, color, transparent: true, opacity, sizeAttenuation: true, blending: THREE.AdditiveBlending, depthWrite: false })
      return new THREE.Points(geo, mat)
    }
    const stars = mkPoints(420, 34, 0.07, 0xfff4cc, 0.55)
    const motes = mkPoints(40, 10, 0.16, 0xffd84d, 0.18)
    scene.add(stars, motes)

    const bloomTex = (() => {
      const c = document.createElement('canvas')
      c.width = c.height = 128
      const x = c.getContext('2d')!
      const g = x.createRadialGradient(64, 64, 0, 64, 64, 64)
      g.addColorStop(0, 'rgba(255,244,204,0.9)')
      g.addColorStop(0.35, 'rgba(255,216,77,0.35)')
      g.addColorStop(1, 'rgba(255,216,77,0)')
      x.fillStyle = g
      x.fillRect(0, 0, 128, 128)
      return new THREE.CanvasTexture(c)
    })()
    const bloomSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: bloomTex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }))
    bloomSprite.position.z = 2
    scene.add(bloomSprite)
    state.current = { stars, motes, bloom: bloomSprite, camera, renderer }

    const resize = () => {
      const w = canvas.clientWidth || 1
      const h = canvas.clientHeight || 1
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    let raf = 0
    let running = true
    const t0 = performance.now()
    const frame = (now: number) => {
      if (!running) return
      const t = (now - t0) / 1000
      const k = intensityRef.current
      const tl = tiltRef.current
      camera.position.x = Math.sin(t * 0.05) * 0.25 + tl.x * 0.15
      camera.position.y = Math.cos(t * 0.04) * 0.2 - tl.y * 0.15
      camera.lookAt(0, 0, -6)
      ;(stars.material as THREE.PointsMaterial).opacity = 0.35 + 0.45 * k
      stars.rotation.z = t * 0.004
      motes.position.y = Math.sin(t * 0.2) * 0.3
      motes.position.x = Math.cos(t * 0.15) * 0.2
      const b = bloomAt.current
      if (b != null) {
        const age = (now - b) / 1000
        const life = 2.2
        const p = Math.min(1, age / life)
        const mat = bloomSprite.material as THREE.SpriteMaterial
        mat.opacity = p < 0.25 ? p / 0.25 : Math.max(0, 1 - (p - 0.25) / 0.75) * 0.9
        const s = 3 + p * 7
        bloomSprite.scale.set(s, s, 1)
        if (p >= 1) bloomAt.current = null
      }
      renderer.render(scene, camera)
      raf = requestAnimationFrame(frame)
    }
    const start = () => {
      if (running) return
      running = true
      raf = requestAnimationFrame(frame)
    }
    const stop = () => {
      running = false
      cancelAnimationFrame(raf)
    }
    const onVisibility = () => (document.hidden ? stop() : start())
    document.addEventListener('visibilitychange', onVisibility)
    raf = requestAnimationFrame(frame)

    return () => {
      stop()
      document.removeEventListener('visibilitychange', onVisibility)
      ro.disconnect()
      stars.geometry.dispose()
      ;(stars.material as THREE.Material).dispose()
      motes.geometry.dispose()
      ;(motes.material as THREE.Material).dispose()
      bloomTex.dispose()
      bloomSprite.material.dispose()
      renderer.dispose()
      state.current = null
    }
  }, [])

  return <canvas ref={ref} className="celestial-scene" aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
}
