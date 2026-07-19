import {
  Tldraw,
  useEditor,
  BaseBoxShapeUtil,
  HTMLContainer,
  TLBaseShape,
  createShapeId,
} from 'tldraw'
import 'tldraw/tldraw.css'
import { useEffect, useState } from 'react'

/**
 * 1. Custom Shape Definition
 * Transforms a static data dashboard widget into an interactive, spatial
 * element on the tldraw canvas.
 */
type ChartShape = TLBaseShape<
  'chart',
  { w: number; h: number; data: number[]; color: string }
>

class ChartShapeUtil extends BaseBoxShapeUtil<ChartShape> {
  static override type = 'chart' as const

  override getDefaultProps(): ChartShape['props'] {
    return {
      w: 400,
      h: 300,
      data: [20, 60, 40, 90, 50, 75, 30],
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
}

const customShapeUtils = [ChartShapeUtil]

/**
 * 2. Camera Controls & Presentation/Slide Logic
 * Demonstrates how to programmatically move the camera to specific points,
 * effectively creating a non-linear presentation or dynamic UI flow.
 */
function CustomUI() {
  const editor = useEditor()
  const [slideIndex, setSlideIndex] = useState(0)

  // Defines spatial frames (slides) within the infinite canvas
  const slides = [
    { x: 0, y: 0, z: 1 },         // Main title / origin
    { x: 800, y: 0, z: 1.2 },     // Focus on dashboard chart
    { x: 400, y: 800, z: 0.8 },   // Zoomed out overview
  ]

  const nextSlide = () => {
    const nextIndex = (slideIndex + 1) % slides.length
    setSlideIndex(nextIndex)
    const target = slides[nextIndex]

    // Cinematic camera movement for transitions
    editor.animateCamera(target, {
      duration: 1000,
      easing: (t) => t * (2 - t), // smooth ease-out
    })
  }

  // Set up the initial scene geometry programmatically
  useEffect(() => {
    if (!editor) return

    const chartId = createShapeId('dashboard-chart')
    const titleId = createShapeId('main-title')

    // Create the custom chart shape if it doesn't exist
    if (!editor.getShape(chartId)) {
      editor.createShape({
        id: chartId,
        type: 'chart',
        x: 800,
        y: -150,
        props: {
          w: 500,
          h: 300,
          data: [15, 45, 80, 40, 95, 60, 20],
          color: '#8b5cf6', // A nice vibrant violet
        },
      })
    }

    // Create a text shape for the title slide
    if (!editor.getShape(titleId)) {
      editor.createShape({
        id: titleId,
        type: 'text',
        x: 0,
        y: 0,
        props: {
          text: 'Interactive Spatial Dashboard',
          w: 400,
          color: 'black',
          size: 'xl',
        },
      })
    }

    // Lock the camera to the first slide on mount
    editor.setCamera(slides[0].x, slides[0].y, slides[0].z)
  }, [editor])

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 40,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 999,
        display: 'flex',
        gap: 16,
      }}
    >
      <button
        onClick={nextSlide}
        style={{
          padding: '16px 32px',
          background: '#09090b',
          color: '#ffffff',
          borderRadius: 999,
          border: 'none',
          cursor: 'pointer',
          fontWeight: 600,
          fontSize: '16px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          transition: 'transform 0.1s ease',
        }}
        onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
        onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      >
        Present Next Frame (Slide {slideIndex + 1}/{slides.length})
      </button>
    </div>
  )
}

/**
 * 3. Main Export Component
 * Assembles the custom shapes and UI overlay on top of the base Tldraw canvas.
 */
export default function TldrawShowcase() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#f8fafc' }}>
      <Tldraw 
        shapeUtils={customShapeUtils}
        hideUi // Hiding default UI to focus on custom dashboard presentation
      >
        <CustomUI />
      </Tldraw>
    </div>
  )
}
