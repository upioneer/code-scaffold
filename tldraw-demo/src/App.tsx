import {
  Tldraw,
  useEditor,
  BaseBoxShapeUtil,
  HTMLContainer,
  createShapeId,
} from 'tldraw'
import type { TLBaseShape } from 'tldraw'
import 'tldraw/tldraw.css'
import { useEffect, useState, useRef } from 'react'
import * as Matter from 'matter-js'

// --- 1. Custom Shape: Live Data Chart ---
type ChartShape = TLBaseShape<'chart', { w: number; h: number; data: number[]; color: string }>

class ChartShapeUtil extends BaseBoxShapeUtil<ChartShape> {
  static override type = 'chart' as const

  override getDefaultProps(): ChartShape['props'] {
    return {
      w: 400,
      h: 300,
      data: [20, 60, 40, 90, 50],
      color: '#3b82f6',
    }
  }

  override component(shape: ChartShape) {
    return (
      <HTMLContainer
        id={shape.id}
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 8,
          padding: 16,
          backgroundColor: '#ffffff',
          borderRadius: 16,
          boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
          width: '100%',
          height: '100%',
          pointerEvents: 'all',
          border: '1px solid #e5e7eb',
        }}
      >
        {shape.props.data.map((val, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: `${val}%`,
              backgroundColor: shape.props.color,
              borderRadius: '6px 6px 0 0',
              transition: 'height 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
        ))}
      </HTMLContainer>
    )
  }

  override indicator(shape: ChartShape) {
    return <rect width={shape.props.w} height={shape.props.h} />
  }

  override getIndicatorPath(shape: ChartShape) {
    const path = new Path2D()
    path.rect(0, 0, shape.props.w, shape.props.h)
    return path
  }
}

// --- 2. Custom Shape: Iframe (Rich Media) ---
type IframeShape = TLBaseShape<'iframe', { w: number; h: number; url: string }>

class IframeShapeUtil extends BaseBoxShapeUtil<IframeShape> {
  static override type = 'iframe' as const

  override getDefaultProps(): IframeShape['props'] {
    return { w: 600, h: 400, url: 'https://example.com' }
  }

  override component(shape: IframeShape) {
    return (
      <HTMLContainer
        id={shape.id}
        style={{
          width: '100%',
          height: '100%',
          pointerEvents: 'all',
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        }}
      >
        <iframe
          src={shape.props.url}
          width="100%"
          height="100%"
          style={{ border: 'none', pointerEvents: 'auto' }}
        />
      </HTMLContainer>
    )
  }

  override indicator(shape: IframeShape) {
    return <rect width={shape.props.w} height={shape.props.h} />
  }

  override getIndicatorPath(shape: IframeShape) {
    const path = new Path2D()
    path.rect(0, 0, shape.props.w, shape.props.h)
    return path
  }
}

const customShapeUtils = [ChartShapeUtil, IframeShapeUtil]

// --- 3. UI Controller: Physics, AI Cursor, Live Data ---
function CustomUI() {
  const editor = useEditor()
  const [physicsEnabled, setPhysicsEnabled] = useState(false)

  // Setup Initial Scene
  useEffect(() => {
    if (!editor) return

    const chartId = createShapeId('live-chart')
    if (!editor.getShape(chartId)) {
      editor.createShape({
        id: chartId,
        type: 'chart',
        x: 100,
        y: 100,
        props: { w: 400, h: 300, data: [20, 40, 60, 80, 50], color: '#8b5cf6' },
      })
    }

    const iframeId = createShapeId('web-iframe')
    if (!editor.getShape(iframeId)) {
      editor.createShape({
        id: iframeId,
        type: 'iframe',
        x: 600,
        y: 100,
        props: { w: 500, h: 400, url: 'https://example.com' },
      })
    }

    // Add a ground line for physics to bounce on
    const groundId = createShapeId('ground-line')
    if (!editor.getShape(groundId)) {
      editor.createShape({
        id: groundId,
        type: 'geo',
        x: -500,
        y: 700,
        props: {
          w: 2500,
          h: 20,
          color: 'black',
          fill: 'solid',
        }
      })
    }
  }, [editor])

  // Feature: Live Data Mutation
  useEffect(() => {
    if (!editor) return
    const interval = setInterval(() => {
      const chartShape = editor.getShape(createShapeId('live-chart'))
      if (chartShape && chartShape.type === 'chart') {
        editor.updateShape({
          id: chartShape.id,
          type: 'chart',
          props: {
            // @ts-ignore
            data: chartShape.props.data.map(() => Math.floor(Math.random() * 90) + 10)
          }
        })
      }
    }, 2000)
    return () => clearInterval(interval)
  }, [editor])

  // Feature: AI Co-Pilot Cursor
  useEffect(() => {
    if (!editor) return
    let angle = 0
    const interval = setInterval(() => {
      angle += 0.05
      const x = 300 + Math.cos(angle) * 200
      const y = 300 + Math.sin(angle) * 100
      
      // Simulates an AI presence on the multiplayer board
      editor.store.put([{
        typeName: 'instance_presence',
        id: 'instance_presence:ai-bot' as any,
        userId: 'user:ai-bot' as any,
        followingUserId: null,
        brush: null,
        userName: 'AutoGPT 🤖',
        cursor: { x, y, type: 'default', rotation: 0 },
        color: '#eab308',
        chatMessage: 'Observing the canvas...',
        lastActivityTimestamp: Date.now(),
        screenBounds: { x: 0, y: 0, w: 1000, h: 1000 },
        currentPageId: editor.getCurrentPageId(),
        selectedShapeIds: [],
        camera: { x: editor.getCamera().x, y: editor.getCamera().y, z: editor.getCamera().z }
      }])
    }, 50)
    return () => clearInterval(interval)
  }, [editor])

  // Feature: Physics Engine
  useEffect(() => {
    if (!editor) return
    let tickId: number
    
    if (physicsEnabled) {
      const engine = Matter.Engine.create()
      const runner = Matter.Runner.create()

      // Map shapes to physics bodies
      const shapeIds = editor.getCurrentPageShapeIds()
      const bodyMap = new Map<string, Matter.Body>()

      shapeIds.forEach(id => {
        const shape = editor.getShape(id)
        if (!shape) return
        
        const bounds = editor.getShapeGeometry(shape).bounds
        
        // Ground line is static
        const isStatic = id === createShapeId('ground-line')
        
        const body = Matter.Bodies.rectangle(
          shape.x + bounds.w / 2,
          shape.y + bounds.h / 2,
          bounds.w,
          bounds.h,
          { 
            isStatic,
            restitution: 0.6, // Bounciness
            friction: 0.1 
          }
        )
        bodyMap.set(id, body)
        Matter.World.add(engine.world, body)
      })

      Matter.Runner.run(runner, engine)

      const tick = () => {
        editor.updateShapes(
          Array.from(bodyMap.entries()).map(([id, body]) => {
            const shape = editor.getShape(id)
            if (!shape) return null
            const bounds = editor.getShapeGeometry(shape).bounds
            return {
              id,
              type: shape.type,
              x: body.position.x - bounds.w / 2,
              y: body.position.y - bounds.h / 2,
              rotation: body.angle
            }
          }).filter(Boolean) as any
        )
        tickId = requestAnimationFrame(tick)
      }
      tick()

      return () => {
        cancelAnimationFrame(tickId)
        Matter.Runner.stop(runner)
        Matter.Engine.clear(engine)
      }
    }
  }, [physicsEnabled, editor])

  return (
    <div style={{ position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 999, display: 'flex', gap: 12 }}>
      <button 
        onClick={() => setPhysicsEnabled(!physicsEnabled)}
        style={{ 
          padding: '12px 24px', 
          background: physicsEnabled ? '#ef4444' : '#10b981', 
          color: 'white', 
          borderRadius: 8, 
          border: 'none', 
          cursor: 'pointer', 
          fontWeight: 600,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}
      >
        {physicsEnabled ? 'Gravity ON (Click to Stop)' : 'Turn On Gravity (Matter.js)'}
      </button>
    </div>
  )
}

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0 }}>
      <Tldraw shapeUtils={customShapeUtils}>
        <CustomUI />
      </Tldraw>
    </div>
  )
}
