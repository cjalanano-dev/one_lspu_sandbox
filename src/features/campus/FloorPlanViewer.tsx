import { useState } from 'react'
import { Info } from 'lucide-react'
import type { Facility, Floor } from '../../types'

interface FloorPlanViewerProps {
  floor: Floor
  facilities: Facility[]
  selectedFacility: Facility | null
  onSelectFacility: (facility: Facility) => void
}

// Normalize seed coordinates (up to ~480x280) into the SVG viewBox (100x70)
const VIEWBOX_W = 100
const VIEWBOX_H = 70
const MAX_SRC_W = 480
const MAX_SRC_H = 280

function normalizePosition(pos: any) {
  if (!pos) return { x: 10, y: 10, width: 25, height: 20 }
  return {
    x: Math.min(Math.max((pos.x ?? 10) / MAX_SRC_W, 0), 1) * VIEWBOX_W,
    y: Math.min(Math.max((pos.y ?? 10) / MAX_SRC_H, 0), 1) * VIEWBOX_H,
    width: Math.min(Math.max((pos.width ?? 25) / MAX_SRC_W, 0.02), 0.25) * VIEWBOX_W,
    height: Math.min(Math.max((pos.height ?? 20) / MAX_SRC_H, 0.02), 0.25) * VIEWBOX_H,
  }
}

function roomFill(facility: Facility, isSelected: boolean, isHovered: boolean) {
  if (isSelected) return 'var(--accent)' // blue fill, paper text
  if (facility.status === 'maintenance') return 'var(--surface-2)' // light gray, hatched
  if (facility.status === 'unavailable') return 'var(--gray-medium)' // medium gray
  if (isHovered) return 'var(--surface-2)' // light gray
  return 'var(--paper)' // white
}

function roomStroke() {
  return 'var(--ink)' // black hairline stroke for every room
}

function roomText(isSelected: boolean) {
  return isSelected ? 'var(--paper)' : 'var(--ink)'
}

function computeRoomPosition(facility: Facility, index: number, total: number) {
  // If explicitly mapped via coordinates, use them
  if (facility.map_position && typeof facility.map_position === 'object' && facility.map_position.x != null) {
    return normalizePosition(facility.map_position)
  }

  // Automatic schematic architecture layout for 100x70 canvas
  if (total === 1) {
    return { x: 18, y: 15, width: 64, height: 40 }
  }

  if (total === 2) {
    return index === 0
      ? { x: 12, y: 14, width: 35, height: 42 }
      : { x: 53, y: 14, width: 35, height: 42 }
  }

  if (total <= 4) {
    const col = index % 2
    const row = Math.floor(index / 2)
    return {
      x: 12 + col * 41,
      y: row === 0 ? 12 : 40,
      width: 35,
      height: 20,
    }
  }

  // 5 to 8 rooms (e.g. Old CCS labs & lecture rooms along top and bottom wings)
  const isTopWing = index < Math.ceil(total / 2)
  const cols = isTopWing ? Math.ceil(total / 2) : total - Math.ceil(total / 2)
  const colIdx = isTopWing ? index : index - Math.ceil(total / 2)
  const roomW = Math.max(14, Math.floor(76 / cols) - 2)

  return {
    x: 12 + colIdx * (roomW + 2),
    y: isTopWing ? 12 : 42,
    width: roomW,
    height: 18,
  }
}

export function FloorPlanViewer({ floor, facilities, selectedFacility, onSelectFacility }: FloorPlanViewerProps) {
  const [hoveredFacility, setHoveredFacility] = useState<Facility | null>(null)

  const floorFacilities = facilities.filter((f) => f.floor_id === floor.id)
  const plottedFacilities = floorFacilities

  const handleRoomKeyDown = (e: React.KeyboardEvent, facility: Facility) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelectFacility(facility)
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start">
      {/* Interactive SVG Canvas */}
      <div className="w-full lg:flex-1 bg-[var(--paper)] rounded-sm border border-[var(--line)] p-4 sm:p-6 overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-[var(--line)] mb-4">
          <div>
            <h3 className="font-bold text-[var(--ink)] text-base flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-[var(--accent)]"></span>
              {floor.name}
            </h3>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              Select any room on the plan to inspect details and start a reservation request
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-[var(--muted)] px-2 py-1 border border-[var(--line)] rounded-sm uppercase tracking-widest">
            Schematic floor plan
          </span>
        </div>

        <div className="relative aspect-[16/10] bg-[var(--paper)] rounded-sm border border-[var(--line)] overflow-hidden  flex items-center justify-center">
          <svg
            viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
            className="w-full h-full select-none"
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label={`Floor plan for ${floor.name}`}
          >
            {/* Building Perimeter outline */}
            <rect
              x="5"
              y="5"
              width={VIEWBOX_W - 10}
              height={VIEWBOX_H - 10}
              rx="2"
              fill="none"
              stroke="var(--ink)"
              strokeWidth="1.2"
              strokeDasharray="2,2"
            />

            {/* Central Corridor */}
            <rect
              x="10"
              y={VIEWBOX_H * 0.45}
              width={VIEWBOX_W - 20}
              height={VIEWBOX_H * 0.12}
              fill="none"
              stroke="var(--ink)"
              strokeWidth="0.6"
            />
            <text
              x={VIEWBOX_W / 2}
              y={VIEWBOX_H * 0.5}
              fill="var(--muted)"
              fontSize="2.6"
              fontFamily="monospace"
              fontWeight="bold"
              textAnchor="middle"
              dominantBaseline="middle"
              className="tracking-widest uppercase pointer-events-none text-[var(--muted)]"
            >
              Central Corridor
            </text>

            {/* Render Facility Rooms */}
            {plottedFacilities.map((facility, idx) => {
              const pos = computeRoomPosition(facility, idx, plottedFacilities.length)
              const isSelected = selectedFacility?.id === facility.id
              const isHovered = hoveredFacility?.id === facility.id

              const centerX = pos.x + pos.width / 2
              const centerY = pos.y + pos.height / 2

              return (
                <g
                  key={facility.id}
                  onClick={() => onSelectFacility(facility)}
                  onKeyDown={(e) => handleRoomKeyDown(e, facility)}
                  onMouseEnter={() => setHoveredFacility(facility)}
                  onMouseLeave={() => setHoveredFacility(null)}
                  className="cursor-pointer transition-colors duration-150"
                  tabIndex={0}
                  role="button"
                  aria-label={`${facility.name}, ${facility.facility_code}, ${facility.capacity} seats, ${facility.status}`}
                  aria-pressed={isSelected ? 'true' : 'false'}
                >
                  {/* Room Box */}
                  <rect
                    x={pos.x}
                    y={pos.y}
                    width={pos.width}
                    height={pos.height}
                    rx="1"
                    fill={roomFill(facility, isSelected, isHovered)}
                    stroke={roomStroke()}
                    strokeWidth={isSelected ? '1' : isHovered ? '0.7' : '0.5'}
                    className="transition-colors duration-150"
                  />

                  {/* Maintenance hatch */}
                  {facility.status === 'maintenance' && (
                    <g>
                      <line
                        x1={pos.x}
                        y1={pos.y}
                        x2={pos.x + pos.width}
                        y2={pos.y + pos.height}
                        stroke="var(--ink)"
                        strokeWidth="0.5"
                        strokeDasharray="1,1"
                      />
                      <line
                        x1={pos.x + pos.width}
                        y1={pos.y}
                        x2={pos.x}
                        y2={pos.y + pos.height}
                        stroke="var(--ink)"
                        strokeWidth="0.5"
                        strokeDasharray="1,1"
                      />
                    </g>
                  )}

                  {/* Room Identifier Label */}
                  <text
                    x={centerX}
                    y={centerY - 1.5}
                    fill={roomText(isSelected)}
                    fontSize="3"
                    fontWeight="bold"
                    fontFamily="monospace"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="pointer-events-none"
                  >
                    {facility.facility_code}
                  </text>

                  {/* Room Type Label */}
                  <text
                    x={centerX}
                    y={centerY + 2.5}
                    fill={roomText(isSelected) === 'var(--paper)' ? 'var(--paper)' : 'var(--muted)'}
                    fontSize="2.1"
                    fontFamily="monospace"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="pointer-events-none capitalize"
                  >
                    {facility.category.replace('_', ' ')}
                  </text>

                  {/* Capacity indicator dot */}
                  <circle
                    cx={pos.x + pos.width - 2.5}
                    cy={pos.y + 2.5}
                    r="1"
                    fill={facility.status === 'maintenance' ? 'var(--muted)' : 'var(--ink)'}
                  />
                </g>
              )
            })}
          </svg>

          {floorFacilities.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <Info className="w-10 h-10 text-[var(--muted)] mb-3" />
              <h4 className="text-sm font-medium text-[var(--ink)]">No facilities on this floor</h4>
              <p className="text-xs text-[var(--muted)] mt-1 max-w-xs">
                {floor.name} doesn't have any facilities yet.
              </p>
            </div>
          ) : plottedFacilities.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <Info className="w-10 h-10 text-[var(--muted)] mb-3" />
              <h4 className="text-sm font-medium text-[var(--ink)]">No floor-plan locations yet</h4>
              <p className="text-xs text-[var(--muted)] mt-1 max-w-xs">
                Facilities exist on {floor.name}, but none have a floor-plan position set. Use the facility list to view them all.
              </p>
            </div>
          ) : null}
        </div>

        {/* Legend */}
        <div className="mt-4 pt-3 border-t border-[var(--line)] flex flex-wrap items-center justify-between text-xs text-[var(--muted)] gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-[var(--accent)] border border-[var(--accent)] inline-block" />
              Selected
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-[var(--paper)] border border-[var(--ink)] inline-block" />
              Available facility
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-[var(--surface-2)] border border-[var(--ink)] inline-block" />
              Under maintenance (hatched)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-[var(--gray-medium)] border border-[var(--ink)] inline-block" />
              Unavailable
            </span>
          </div>
          <span className="text-[var(--ink)] font-medium">
            {plottedFacilities.length} on plan{floorFacilities.length > plottedFacilities.length ? ` · ${floorFacilities.length - plottedFacilities.length} not on plan` : ''}
          </span>
        </div>
      </div>
    </div>
  )
}
