import { useCallback, useRef, useState } from 'react'
import { Code2, Database, FolderOpen, Table2 } from 'lucide-react'
import type { LineageGraph, LineageGraphNode, LineageNodeType } from '../../data/lineageGraph'

const NODE_W = 56

function nodeAnchor(node: LineageGraphNode, side: 'left' | 'right') {
  return {
    x: side === 'right' ? node.x + NODE_W : node.x,
    y: node.y + 20,
  }
}

function curvedEdgePath(x1: number, y1: number, x2: number, y2: number) {
  const bend = Math.max(40, Math.abs(x2 - x1) * 0.45)
  return `M ${x1} ${y1} C ${x1 + bend} ${y1}, ${x2 - bend} ${y2}, ${x2} ${y2}`
}

function NodeIcon({ type, restricted }: { type: LineageNodeType; restricted?: boolean }) {
  const className = `h-7 w-7 ${restricted ? 'text-impact' : type === 'source' ? 'text-impact' : 'text-brand'}`
  if (type === 'source') return <FolderOpen className={className} strokeWidth={1.75} />
  if (type === 'query') return <Code2 className={className} strokeWidth={1.75} />
  if (type === 'output') return <Database className={className} strokeWidth={1.75} />
  return <Table2 className={className} strokeWidth={1.75} />
}

interface LineageCanvasProps {
  graph: LineageGraph
  className?: string
  viewportHeight?: number
}

export function LineageCanvas({ graph, className = '', viewportHeight = 208 }: LineageCanvasProps) {
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const dragRef = useRef<{ startX: number; startY: number; panX: number; panY: number } | null>(null)

  const onPointerDown = useCallback(
    (event: React.PointerEvent) => {
      if (event.button !== 0) return
      dragRef.current = {
        startX: event.clientX,
        startY: event.clientY,
        panX: pan.x,
        panY: pan.y,
      }
      event.currentTarget.setPointerCapture(event.pointerId)
    },
    [pan.x, pan.y],
  )

  const onPointerMove = useCallback((event: React.PointerEvent) => {
    if (!dragRef.current) return
    setPan({
      x: dragRef.current.panX + (event.clientX - dragRef.current.startX),
      y: dragRef.current.panY + (event.clientY - dragRef.current.startY),
    })
  }, [])

  const onPointerUp = useCallback((event: React.PointerEvent) => {
    dragRef.current = null
    event.currentTarget.releasePointerCapture(event.pointerId)
  }, [])

  const nodeMap = new Map(graph.nodes.map((node) => [node.id, node]))

  return (
    <div
      className={`relative overflow-hidden rounded border border-border bg-white ${className}`}
      style={{ height: viewportHeight }}
    >
      <div
        className="h-full w-full cursor-grab touch-none select-none active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div
          className="relative"
          style={{
            width: graph.width,
            height: graph.height,
            transform: `translate(${pan.x}px, ${pan.y}px)`,
          }}
        >
          <svg
            className="pointer-events-none absolute inset-0"
            width={graph.width}
            height={graph.height}
            aria-hidden
          >
            {graph.edges.map((edge) => {
              const from = nodeMap.get(edge.from)
              const to = nodeMap.get(edge.to)
              if (!from || !to) return null
              const start = nodeAnchor(from, 'right')
              const end = nodeAnchor(to, 'left')
              return (
                <path
                  key={`${edge.from}-${edge.to}`}
                  d={curvedEdgePath(start.x, start.y, end.x, end.y)}
                  fill="none"
                  stroke={edge.restricted ? '#d14600' : '#b3babc'}
                  strokeWidth={1.5}
                  strokeDasharray={edge.restricted ? '4 3' : undefined}
                  opacity={edge.restricted ? 0.7 : 1}
                />
              )
            })}
          </svg>

          {graph.nodes.map((node) => (
            <div
              key={node.id}
              className="absolute flex flex-col items-center"
              style={{ left: node.x, top: node.y, width: NODE_W }}
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-md border ${
                  node.restricted
                    ? 'border-impact/30 bg-orange-50'
                    : node.type === 'source'
                      ? 'border-impact/30 bg-orange-50'
                      : 'border-brand/15 bg-highlight/40'
                }`}
              >
                <NodeIcon type={node.type} restricted={node.restricted} />
              </div>
              <span
                className={`mt-1 max-w-[88px] text-center text-[10px] leading-tight ${
                  node.restricted ? 'text-impact' : 'text-body'
                }`}
                style={{ width: node.type === 'table' || node.type === 'output' ? 88 : NODE_W }}
              >
                {node.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
