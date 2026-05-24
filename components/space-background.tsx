"use client"

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function SpaceBackground() {
  const mountRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const initializedRef = useRef(false)

  useEffect(() => {
    if (!mountRef.current || initializedRef.current) return

    try {
      initializedRef.current = true

      // Scene setup
      const scene = new THREE.Scene()
      sceneRef.current = scene

      // Camera setup
      const camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        3000
      )
      camera.position.set(0, 0, 800)
      cameraRef.current = camera

      // Renderer setup with comprehensive error handling
      let renderer: THREE.WebGLRenderer
      try {
        renderer = new THREE.WebGLRenderer({
          antialias: false,
          alpha: true,
          powerPreference: "default",
          precision: "mediump"
        })
      } catch {
        console.warn('WebGL not supported, using fallback')
        const fallbackDiv = document.createElement('div')
        fallbackDiv.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(to bottom, #0f172a, #581c87, #0f172a);
          z-index: -10;
          pointer-events: none;
        `
        mountRef.current.appendChild(fallbackDiv)
        return
      }

      renderer.setSize(window.innerWidth, window.innerHeight)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1))
      renderer.setClearColor(0x000000, 0)
      rendererRef.current = renderer

      mountRef.current.appendChild(renderer.domElement)

      // Create comprehensive space scene
      createSpaceScene(scene)

      // Animation loop
      const animate = () => {
        animationFrameRef.current = requestAnimationFrame(animate)

        // Gentle camera movement for parallax
        camera.rotation.y += 0.0002
        camera.rotation.x += 0.0001

        // Update all space objects
        updateSpaceObjects(scene)

        renderer.render(scene, camera)
      }
      animate()

      // Handle window resize
      const handleResize = () => {
        if (!camera || !renderer) return

        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
        renderer.setSize(window.innerWidth, window.innerHeight)
      }

      window.addEventListener('resize', handleResize)

      // Cleanup function
      return () => {
        window.removeEventListener('resize', handleResize)
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
        }
        if (mountRef.current && renderer.domElement) {
          mountRef.current.removeChild(renderer.domElement)
        }
        disposeScene(scene)
        renderer.dispose()
      }
    } catch (error) {
      console.warn('Three.js scene creation failed:', error)
      if (mountRef.current) {
        const fallbackDiv = document.createElement('div')
        fallbackDiv.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(to bottom, #0f172a, #581c87, #0f172a);
          z-index: -10;
          pointer-events: none;
        `
        mountRef.current.appendChild(fallbackDiv)
      }
    }
  }, [])

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 -z-10 pointer-events-none space-background"
      style={{ background: 'linear-gradient(to bottom, #0f172a, #581c87, #0f172a)' }}
    />
  )
}

function createSpaceScene(scene: THREE.Scene) {
  // === STARS FIELD ===
  const starsGeometry = new THREE.BufferGeometry()
  const starsMaterial = new THREE.PointsMaterial({
    size: 2,
    transparent: true,
    opacity: 0.8,
    vertexColors: true,
    sizeAttenuation: true
  })

  const starsVertices = []
  const colors = []

  for (let i = 0; i < 1500; i++) {
    const x = (Math.random() - 0.5) * 2500
    const y = (Math.random() - 0.5) * 2500
    const z = (Math.random() - 0.5) * 2500
    starsVertices.push(x, y, z)

    // Color variety for stars
    const color = new THREE.Color()
    const colorType = Math.random()
    if (colorType < 0.5) {
      color.setHSL(0, 0, 0.9) // White stars
    } else if (colorType < 0.75) {
      color.setHSL(0.6, 0.8, 0.8) // Blue stars
    } else {
      color.setHSL(0.1, 0.9, 0.7) // Orange stars
    }
    colors.push(color.r, color.g, color.b)
  }

  starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3))
  starsGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  const stars = new THREE.Points(starsGeometry, starsMaterial)
  stars.userData = { type: 'stars', rotationSpeed: 0.00005 }
  scene.add(stars)

  // === SUN ===
  const sunGroup = new THREE.Group()

  // Sun core
  const sunGeometry = new THREE.SphereGeometry(35, 24, 24)
  const sunMaterial = new THREE.MeshBasicMaterial({
    color: 0xffd700,
    transparent: true,
    opacity: 0.9
  })
  const sun = new THREE.Mesh(sunGeometry, sunMaterial)
  sunGroup.add(sun)

  // Sun corona layers
  for (let i = 0; i < 3; i++) {
    const coronaGeometry = new THREE.SphereGeometry(37 + i * 3, 16, 16)
    const coronaMaterial = new THREE.MeshBasicMaterial({
      color: 0xffa500,
      transparent: true,
      opacity: 0.3 - i * 0.08,
      side: THREE.BackSide
    })
    const corona = new THREE.Mesh(coronaGeometry, coronaMaterial)
    sunGroup.add(corona)
  }

  sunGroup.position.set(-250, 150, -400)
  sunGroup.userData = { type: 'sun', rotationSpeed: 0.01 }
  scene.add(sunGroup)

  // === EARTH ===
  const earthGroup = new THREE.Group()

  // Earth surface
  const earthGeometry = new THREE.SphereGeometry(25, 20, 20)
  const earthMaterial = new THREE.MeshPhongMaterial({
    color: 0x1e40af,
    transparent: true,
    opacity: 0.9,
    emissive: 0x1e3a8a,
    emissiveIntensity: 0.1,
    shininess: 30
  })
  const earth = new THREE.Mesh(earthGeometry, earthMaterial)
  earthGroup.add(earth)

  // Earth continents
  const continentsGeometry = new THREE.SphereGeometry(25.2, 12, 12)
  const continentsMaterial = new THREE.MeshBasicMaterial({
    color: 0x16a34a,
    transparent: true,
    opacity: 0.4
  })
  const continents = new THREE.Mesh(continentsGeometry, continentsMaterial)
  earthGroup.add(continents)

  // Earth atmosphere
  const atmosphereGeometry = new THREE.SphereGeometry(27, 16, 16)
  const atmosphereMaterial = new THREE.MeshBasicMaterial({
    color: 0x3b82f6,
    transparent: true,
    opacity: 0.2,
    side: THREE.BackSide
  })
  const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial)
  earthGroup.add(atmosphere)

  earthGroup.position.set(200, 80, -300)
  earthGroup.userData = { type: 'planet', rotationSpeed: 0.008 }
  scene.add(earthGroup)

  // === MOON ===
  const moonGeometry = new THREE.SphereGeometry(15, 16, 16)
  const moonMaterial = new THREE.MeshPhongMaterial({
    color: 0xf8fafc,
    transparent: true,
    opacity: 0.95,
    emissive: 0xf1f5f9,
    emissiveIntensity: 0.05,
    shininess: 10
  })
  const moon = new THREE.Mesh(moonGeometry, moonMaterial)
  moon.position.set(-150, 200, -250)
  moon.userData = { type: 'moon', rotationSpeed: 0.005 }
  scene.add(moon)

  // === MARS ===
  const marsGeometry = new THREE.SphereGeometry(20, 18, 18)
  const marsMaterial = new THREE.MeshPhongMaterial({
    color: 0xdc2626,
    transparent: true,
    opacity: 0.85,
    emissive: 0xb91c1c,
    emissiveIntensity: 0.1,
    shininess: 20
  })
  const mars = new THREE.Mesh(marsGeometry, marsMaterial)
  mars.position.set(-100, -50, -350)
  mars.userData = { type: 'planet', rotationSpeed: -0.006 }
  scene.add(mars)

  // === VENUS ===
  const venusGeometry = new THREE.SphereGeometry(23, 20, 20)
  const venusMaterial = new THREE.MeshPhongMaterial({
    color: 0xf59e0b,
    transparent: true,
    opacity: 0.88,
    emissive: 0xd97706,
    emissiveIntensity: 0.15,
    shininess: 15
  })
  const venus = new THREE.Mesh(venusGeometry, venusMaterial)
  venus.position.set(150, -120, -400)
  venus.userData = { type: 'planet', rotationSpeed: 0.009 }
  scene.add(venus)

  // === JUPITER ===
  const jupiterGeometry = new THREE.SphereGeometry(45, 24, 24)
  const jupiterMaterial = new THREE.MeshPhongMaterial({
    color: 0xd97706,
    transparent: true,
    opacity: 0.9,
    emissive: 0xb45309,
    emissiveIntensity: 0.1,
    shininess: 25
  })
  const jupiter = new THREE.Mesh(jupiterGeometry, jupiterMaterial)
  jupiter.position.set(-400, -200, -600)
  jupiter.userData = { type: 'gasPlanet', rotationSpeed: 0.004 }
  scene.add(jupiter)

  // Jupiter rings
  const ringsGeometry = new THREE.RingGeometry(48, 65, 32)
  const ringsMaterial = new THREE.MeshBasicMaterial({
    color: 0xf59e0b,
    transparent: true,
    opacity: 0.4,
    side: THREE.DoubleSide
  })
  const rings = new THREE.Mesh(ringsGeometry, ringsMaterial)
  rings.position.copy(jupiter.position)
  rings.rotation.x = Math.PI / 2
  rings.userData = { type: 'rings', rotationSpeed: 0.003 }
  scene.add(rings)

  // === ROCKET ===
  const rocketGroup = new THREE.Group()

  // Rocket body
  const rocketBodyGeometry = new THREE.CylinderGeometry(2, 3, 20, 8)
  const rocketBodyMaterial = new THREE.MeshPhongMaterial({
    color: 0xdc2626,
    transparent: true,
    opacity: 0.95,
    emissive: 0xb91c1c,
    emissiveIntensity: 0.1,
    shininess: 80
  })
  const rocketBody = new THREE.Mesh(rocketBodyGeometry, rocketBodyMaterial)
  rocketGroup.add(rocketBody)

  // Nose cone
  const noseGeometry = new THREE.ConeGeometry(2, 5, 8)
  const noseMaterial = new THREE.MeshPhongMaterial({
    color: 0xf87171,
    transparent: true,
    opacity: 0.9,
    emissive: 0xef4444,
    emissiveIntensity: 0.05,
    shininess: 70
  })
  const nose = new THREE.Mesh(noseGeometry, noseMaterial)
  nose.position.y = 12.5
  rocketGroup.add(nose)

  // Fins
  for (let i = 0; i < 4; i++) {
    const finGeometry = new THREE.BoxGeometry(1, 7, 0.5)
    const finMaterial = new THREE.MeshPhongMaterial({
      color: 0xb91c1c,
      transparent: true,
      opacity: 0.9,
      emissive: 0x991b1b,
      emissiveIntensity: 0.05,
      shininess: 50
    })
    const fin = new THREE.Mesh(finGeometry, finMaterial)
    const angle = (i / 4) * Math.PI * 2
    fin.position.x = Math.cos(angle) * 3
    fin.position.z = Math.sin(angle) * 3
    fin.position.y = -6
    fin.rotation.y = angle
    rocketGroup.add(fin)
  }

  // Flame
  const flameGeometry = new THREE.ConeGeometry(2.5, 8, 6)
  const flameMaterial = new THREE.MeshBasicMaterial({
    color: 0xff6b35,
    transparent: true,
    opacity: 0.8
  })
  const flame = new THREE.Mesh(flameGeometry, flameMaterial)
  flame.position.y = -14
  rocketGroup.add(flame)

  rocketGroup.position.set(300, -100, -300)
  rocketGroup.userData = { type: 'rocket', rotationSpeed: 0.012, moveSpeed: 0.3 }
  scene.add(rocketGroup)

  // === SPACE STATION ===
  const stationGroup = new THREE.Group()

  // Main module
  const mainModuleGeometry = new THREE.CylinderGeometry(6, 6, 15, 12)
  const mainModuleMaterial = new THREE.MeshPhongMaterial({
    color: 0x6b7280,
    transparent: true,
    opacity: 0.9,
    emissive: 0x4b5563,
    emissiveIntensity: 0.1,
    shininess: 60
  })
  const mainModule = new THREE.Mesh(mainModuleGeometry, mainModuleMaterial)
  stationGroup.add(mainModule)

  // Solar arrays
  const solarArrayGeometry = new THREE.BoxGeometry(18, 0.3, 4)
  const solarArrayMaterial = new THREE.MeshPhongMaterial({
    color: 0x10b981,
    transparent: true,
    opacity: 0.85,
    emissive: 0x059669,
    emissiveIntensity: 0.15,
    shininess: 40
  })

  const leftArray = new THREE.Mesh(solarArrayGeometry, solarArrayMaterial)
  leftArray.position.x = -12
  stationGroup.add(leftArray)

  const rightArray = new THREE.Mesh(solarArrayGeometry, solarArrayMaterial)
  rightArray.position.x = 12
  stationGroup.add(rightArray)

  stationGroup.position.set(-200, -80, -400)
  stationGroup.userData = { type: 'station', rotationSpeed: 0.005 }
  scene.add(stationGroup)

  // === UFO ===
  const ufoGroup = new THREE.Group()

  // UFO body
  const ufoBodyGeometry = new THREE.CylinderGeometry(10, 10, 3, 16)
  const ufoBodyMaterial = new THREE.MeshPhongMaterial({
    color: 0x8b5cf6,
    transparent: true,
    opacity: 0.9,
    emissive: 0x7c3aed,
    emissiveIntensity: 0.2,
    shininess: 90
  })
  const ufoBody = new THREE.Mesh(ufoBodyGeometry, ufoBodyMaterial)
  ufoGroup.add(ufoBody)

  // UFO dome
  const domeGeometry = new THREE.SphereGeometry(5, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2)
  const domeMaterial = new THREE.MeshPhongMaterial({
    color: 0xa855f7,
    transparent: true,
    opacity: 0.95,
    emissive: 0x9333ea,
    emissiveIntensity: 0.1,
    shininess: 70
  })
  const dome = new THREE.Mesh(domeGeometry, domeMaterial)
  dome.position.y = 1.5
  ufoGroup.add(dome)

  // UFO lights
  for (let i = 0; i < 8; i++) {
    const lightGeometry = new THREE.SphereGeometry(0.6, 6, 6)
    const lightMaterial = new THREE.MeshBasicMaterial({
      color: i % 2 === 0 ? 0x10b981 : 0xf59e0b,
      transparent: true,
      opacity: 0.9
    })
    const light = new THREE.Mesh(lightGeometry, lightMaterial)
    const angle = (i / 8) * Math.PI * 2
    light.position.x = Math.cos(angle) * 8
    light.position.z = Math.sin(angle) * 8
    light.position.y = -1.2
    ufoGroup.add(light)
  }

  ufoGroup.position.set(150, -80, -350)
  ufoGroup.userData = { type: 'ufo', rotationSpeed: -0.008, hoverSpeed: 0.2 }
  scene.add(ufoGroup)

  // === ASTRONAUT ===
  const astronautGroup = new THREE.Group()

  // Body suit
  const bodyGeometry = new THREE.CylinderGeometry(1.2, 1.8, 5, 8)
  const bodyMaterial = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.95,
    emissive: 0xf8fafc,
    emissiveIntensity: 0.05,
    shininess: 30
  })
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
  astronautGroup.add(body)

  // Helmet
  const helmetGeometry = new THREE.SphereGeometry(1.8, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2)
  const helmetMaterial = new THREE.MeshPhongMaterial({
    color: 0x87ceeb,
    transparent: true,
    opacity: 0.9,
    emissive: 0x60a5fa,
    emissiveIntensity: 0.1,
    shininess: 50
  })
  const helmet = new THREE.Mesh(helmetGeometry, helmetMaterial)
  helmet.position.y = 2
  astronautGroup.add(helmet)

  // Visor
  const visorGeometry = new THREE.SphereGeometry(1.3, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2)
  const visorMaterial = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.8
  })
  const visor = new THREE.Mesh(visorGeometry, visorMaterial)
  visor.position.y = 2
  visor.position.z = 1.4
  astronautGroup.add(visor)

  // Jetpack
  const jetpackGeometry = new THREE.BoxGeometry(2.5, 3.5, 1)
  const jetpackMaterial = new THREE.MeshPhongMaterial({
    color: 0x374151,
    transparent: true,
    opacity: 0.9,
    emissive: 0x1f2937,
    emissiveIntensity: 0.05,
    shininess: 40
  })
  const jetpack = new THREE.Mesh(jetpackGeometry, jetpackMaterial)
  jetpack.position.z = -0.8
  astronautGroup.add(jetpack)

  // Thruster flames
  for (let i = 0; i < 2; i++) {
    const flameGeometry = new THREE.ConeGeometry(0.3, 1.5, 4)
    const flameMaterial = new THREE.MeshBasicMaterial({
      color: 0x3b82f6,
      transparent: true,
      opacity: 0.8
    })
    const flame = new THREE.Mesh(flameGeometry, flameMaterial)
    flame.position.x = i === 0 ? -0.8 : 0.8
    flame.position.z = -1.2
    flame.position.y = -2
    astronautGroup.add(flame)
  }

  astronautGroup.position.set(-300, 50, -200)
  astronautGroup.userData = { type: 'astronaut', rotationSpeed: 0.015, floatSpeed: 0.2 }
  scene.add(astronautGroup)

  // === COMET ===
  const cometGroup = new THREE.Group()

  // Comet head
  const cometHeadGeometry = new THREE.SphereGeometry(2.5, 8, 8)
  const cometHeadMaterial = new THREE.MeshBasicMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0.95
  })
  const cometHead = new THREE.Mesh(cometHeadGeometry, cometHeadMaterial)
  cometGroup.add(cometHead)

  // Comet tail
  const tailGeometry = new THREE.CylinderGeometry(0.1, 2, 20, 6)
  const tailMaterial = new THREE.MeshBasicMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0.4
  })
  const tail = new THREE.Mesh(tailGeometry, tailMaterial)
  tail.position.z = -10
  tail.rotation.z = Math.PI / 2
  cometGroup.add(tail)

  cometGroup.position.set(400, 180, -500)
  cometGroup.userData = { type: 'comet', moveSpeed: 1.5 }
  scene.add(cometGroup)

  // === ASTEROIDS ===
  for (let i = 0; i < 15; i++) {
    const asteroidGeometry = new THREE.DodecahedronGeometry(3 + Math.random() * 4, 0)
    const asteroidMaterial = new THREE.MeshPhongMaterial({
      color: Math.random() > 0.5 ? 0x8b4513 : 0x6b7280,
      transparent: true,
      opacity: 0.7 + Math.random() * 0.2,
      emissive: new THREE.Color(Math.random() > 0.5 ? 0x8b4513 : 0x6b7280).multiplyScalar(0.1),
      emissiveIntensity: 0.05,
      shininess: 10
    })

    const asteroid = new THREE.Mesh(asteroidGeometry, asteroidMaterial)
    asteroid.position.set(
      (Math.random() - 0.5) * 800,
      (Math.random() - 0.5) * 600,
      (Math.random() - 0.5) * 800
    )
    asteroid.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    )
    asteroid.userData = { type: 'asteroid', rotationSpeed: 0.005 + Math.random() * 0.01 }
    scene.add(asteroid)
  }

  // === SATELLITES ===
  for (let i = 0; i < 3; i++) {
    const satelliteGeometry = new THREE.BoxGeometry(4, 1, 2)
    const satelliteMaterial = new THREE.MeshPhongMaterial({
      color: 0x64748b,
      transparent: true,
      opacity: 0.9,
      emissive: 0x475569,
      emissiveIntensity: 0.1,
      shininess: 50
    })
    const satellite = new THREE.Mesh(satelliteGeometry, satelliteMaterial)
    satellite.position.set(
      80 + i * 60,
      120 + i * 30,
      -320 - i * 40
    )
    satellite.userData = { type: 'satellite', rotationSpeed: 0.01 + i * 0.005 }
    scene.add(satellite)
  }

  // === ALIEN SPACESHIP ===
  const alienShipGroup = new THREE.Group()

  // Main body
  const alienBodyGeometry = new THREE.CylinderGeometry(12, 16, 25, 10)
  const alienBodyMaterial = new THREE.MeshPhongMaterial({
    color: 0x059669,
    transparent: true,
    opacity: 0.85,
    emissive: 0x047857,
    emissiveIntensity: 0.15,
    shininess: 70
  })
  const alienBody = new THREE.Mesh(alienBodyGeometry, alienBodyMaterial)
  alienShipGroup.add(alienBody)

  // Engine glow
  const engineGeometry = new THREE.CylinderGeometry(3, 4, 2, 8)
  const engineMaterial = new THREE.MeshBasicMaterial({
    color: 0xff6b35,
    transparent: true,
    opacity: 0.6
  })
  const engine = new THREE.Mesh(engineGeometry, engineMaterial)
  engine.position.y = -13.5
  alienShipGroup.add(engine)

  alienShipGroup.position.set(-500, 250, -700)
  alienShipGroup.userData = { type: 'alienShip', rotationSpeed: 0.003, moveSpeed: 0.4 }
  scene.add(alienShipGroup)

  // === NEBULA ===
  const nebulaGeometry = new THREE.SphereGeometry(600, 16, 16)
  const nebulaMaterial = new THREE.MeshBasicMaterial({
    color: 0x1e1b4b,
    transparent: true,
    opacity: 0.05,
    side: THREE.BackSide
  })
  const nebula = new THREE.Mesh(nebulaGeometry, nebulaMaterial)
  scene.add(nebula)

  // === LIGHTING ===
  const ambientLight = new THREE.AmbientLight(0x404040, 0.8)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0)
  directionalLight.position.set(1, 1, 1)
  scene.add(directionalLight)

  // Sun light
  const sunLight = new THREE.PointLight(0xffd700, 1.2, 500)
  sunLight.position.copy(sunGroup.position)
  scene.add(sunLight)
}

function updateSpaceObjects(scene: THREE.Scene) {
  scene.children.forEach((object) => {
    if (object.userData.type) {
      switch (object.userData.type) {
        case 'stars':
          object.rotation.y += object.userData.rotationSpeed
          break
        case 'sun':
        case 'planet':
        case 'moon':
        case 'gasPlanet':
          object.rotation.y += object.userData.rotationSpeed
          break
        case 'rings':
          object.rotation.z += object.userData.rotationSpeed
          break
        case 'station':
        case 'satellite':
          object.rotation.y += object.userData.rotationSpeed
          object.rotation.x += object.userData.rotationSpeed * 0.5
          break
        case 'rocket':
          object.rotation.y += object.userData.rotationSpeed
          object.position.y += Math.sin(Date.now() * 0.001) * object.userData.moveSpeed
          break
        case 'ufo':
          object.rotation.y += object.userData.rotationSpeed
          object.position.y += Math.sin(Date.now() * 0.002) * object.userData.hoverSpeed
          break
        case 'astronaut':
          object.rotation.y += object.userData.rotationSpeed
          object.position.y += Math.sin(Date.now() * 0.002) * object.userData.floatSpeed
          break
        case 'comet':
          object.position.x -= object.userData.moveSpeed
          if (object.position.x < -600) {
            object.position.x = 600
          }
          object.rotation.z += 0.02
          break
        case 'alienShip':
          object.rotation.y += object.userData.rotationSpeed
          object.position.z += Math.sin(Date.now() * 0.0005) * object.userData.moveSpeed
          break
        case 'asteroid':
          object.rotation.x += object.userData.rotationSpeed
          object.rotation.y += object.userData.rotationSpeed * 0.8
          object.rotation.z += object.userData.rotationSpeed * 0.6
          break
        case 'nebula':
          object.rotation.y += object.userData.rotationSpeed || 0.00005
          break
      }
    }
  })
}

function disposeScene(scene: THREE.Scene) {
  scene.children.forEach((object) => {
    if (object instanceof THREE.Mesh) {
      if (object.geometry) object.geometry.dispose?.()
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach(material => material.dispose?.())
        } else {
          object.material.dispose?.()
        }
      }
    } else if (object instanceof THREE.Points) {
      if (object.geometry) object.geometry.dispose?.()
      if (object.material) object.material.dispose?.()
    }
  })
}
