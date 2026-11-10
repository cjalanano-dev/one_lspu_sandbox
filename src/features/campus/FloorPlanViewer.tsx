import { useState } from 'react'
import { Building2, Info, Users, Cpu, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
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
  if (facility.status === 'maintenance') return '#F5F5F5' // hatched
  if (isSelected) return '#0A0A0A' // black
  if (isHovered) return '#F5F5F5' // light gray
  return '#FFFFFF' // white
}

function roomStroke(facility: Facility, isSelected: boolean, isHovered: boolean) {
  if (isSelected) return '#0A0A0A'
  if (facility.status === 'maintenance') return '#0A0A0A'
  if (isHovered) return '#0A0A0A'
  return '#0A0A0A'
}

export function FloorPlanViewer({ floor, facilities, selectedFacility, onSelectFacility }: FloorPlanViewerProps) {
  const [hoveredFacility, setHoveredFacility] = useState<Facility | null>(null)

  const floorFacilities = facilities.filter((f) => f.floor_id === floor.id)

  const handleRoomKeyDown = (e: React.KeyboardEvent, facility: Facility) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelectFacility(facility)
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start">
      {/* Interactive SVG Canvas */}
      <div className="w-full lg:flex-1 bg-white rounded-sm border border-[var(--line)] p-4 sm:p-6 overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-[var(--line)] mb-4">
          <div>
            <h3 className="font-bold text-[var(--ink)] text-base flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-[var(--ink)]"></span>
              {floor.name}
            </h3>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              Select any room on the plan to inspect details and start a reservation request
            </p>
          </div>
          <span className="text-[11px] font-mono font-bold text-[var(--muted)] px-2 py-1 border border-[var(--line)] rounded-sm uppercase tracking-widest">
            Interactive 2D Plan
          </span>
        </div>

        <div className="relative aspect-[16/10] bg-white rounded-sm border border-[var(--line)] overflow-hidden shadow-sm flex items-center justify-center">
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
              stroke="#0A0A0A"
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
              stroke="#0A0A0A"
              strokeWidth="0.6"
            />
            <text
              x={VIEWBOX_W / 2}
              y={VIEWBOX_H * 0.5}
              fill="#525252"
              fontSize="2.5"
              fontFamily="monospace"
              textAnchor="middle"
              dominantBaseline="middle"
              className="tracking-widest uppercase font-semibold pointer-events-none text-[var(--muted)]"
            >
              Main Central Concourse
            </text>

            {/* Render Facility Rooms */}
            {floorFacilities.map((facility) => {
              const pos = normalizePosition(facility.map_position)
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
                  className="cursor-pointer transition-all duration-150 focus-visible:outline-none"
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
                    stroke={roomStroke(facility, isSelected, isHovered)}
                    strokeWidth={isSelected ? '1' : isHovered ? '0.7' : '0.5'}
                    className="transition-colors duration-100"
                  />

                  {/* Maintenance hatch */}
                  {facility.status === 'maintenance' && (
                    <g>
                      <line
                        x1={pos.x}
                        y1={pos.y}
                        x2={pos.x + pos.width}
                        y2={pos.y + pos.height}
                        stroke="#0A0A0A"
                        strokeWidth="0.5"
                        strokeDasharray="1,1"
                      />
                      <line
                        x1={pos.x + pos.width}
                        y1={pos.y}
                        x2={pos.x}
                        y2={pos.y + pos.height}
                        stroke="#0A0A0A"
                        strokeWidth="0.5"
                        strokeDasharray="1,1"
                      />
                    </g>
                  )}

                  {/* Room Identifier Label */}
                  <text
                    x={centerX}
                    y={centerY - 1.5}
                    fill={isSelected || facility.status === 'maintenance' ? '#FFFFFF' : '#0A0A0A'}
                    fontSize="2.4"
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
                    fill={isSelected || facility.status === 'maintenance' ? '#FFFFFF' : '#525252'}
                    fontSize="1.7"
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
                    fill={facility.status === 'maintenance' ? '#525252' : '#0A0A0A'}
                  />
                </g>
              )
            })}
          </svg>

          {floorFacilities.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <Info className="w-10 h-10 text-[var(--muted)] mb-3" />
              <h4 className="text-sm font-medium text-[var(--ink)]">No facilities on this floor</h4>
              <p className="text-xs text-[var(--muted)] mt-1 max-w-xs">
                {floor.name} doesn't have any rooms drawn yet. Use the facility list below instead.
              </p>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="mt-4 pt-3 border-t border-[var(--line)] flex flex-wrap items-center justify-between text-[11px] text-[var(--muted)] gap-4">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-[var(--ink)] border border-[var(--ink)] inline-block" />
              Selected
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-white border border-[var(--ink)] inline-block" />
              Available facility
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-[var(--surface-2)] border border-[var(--ink)] inline-block" />
              Under maintenance
            </span>
          </div>
          <span className="text-[var(--ink)]">
            {floorFacilities.length} facilities on this level
          </span>
        </div>
      </div>

      {/* Selected Facility Detail Preview Panel */}
      <div className="w-full lg:w-96 bg-white rounded-sm border border-[var(--line)] p-6 flex flex-col justify-between">
        {selectedFacility ? (
          <div className="space-y-5">
            <div className="relative rounded-sm overflow-hidden aspect-video bg-[var(--surface-2)] border border-[var(--line)]">
              {selectedFacility.image_url ? (
                <img
                  src={selectedFacility.image_url}
                  alt={selectedFacility.name}
                  className="w-full h-full object-cover grayscale"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full bg-[var(--surface-2)] flex items-center justify-center border border-[var(--line)]">
                  <Building2 className="w-12 h-12 text-[var(--faint)]" />
                </div>
              )}
              <span className="absolute top-2 right-2 px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase bg-[var(--ink)] text-white border border-[var(--ink)]">
                {selectedFacility.facility_code}
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm border border-[var(--ink)] text-[10px] font-bold uppercase bg-[var(--ink)] text-white">
                  {selectedFacility.category.replace('_', ' ')}
                </span>
                <span className="flex items-center gap-1 text-[var(--ink)] font-medium">
                  <CheckCircle2 className="w-3 h-3" />
                  Reservable
                </span>
              </div>
              <h4 className="text-lg font-bold text-[var(--ink)] mt-2">{selectedFacility.name}</h4>
              <p className="text-xs text-[var(--muted)] mt-1 leading-relaxed">
                {selectedFacility.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[var(--line)] text-xs">
              <div className="border border-[var(--line)] p-2.5 rounded-sm bg-[var(--surface)]">
                <span className="text-[var(--faint)] block font-medium">Capacity</span>
                <span className="font-bold text-[var(--ink)] text-sm flex items-center gap-1.5 mt-0.5">
                  <Users className="w-3 h-3 text-[var(--ink)]" />
                  {selectedFacility.capacity} Seats
                </span>
              </div>
              <div className="border border-[var(--line)] p-2.5 rounded-sm bg-[var(--surface)]">
                <span className="text-[var(--faint)] block font-medium">Equipment</span>
                <span className="font-bold text-[var(--ink)] text-sm flex items-center gap-1.5 mt-0.5">
                  <Cpu className="w-3 h-3 text-[var(--ink)]" />
                  {selectedFacility.equipment?.length || 0} Listed
                </span>
              </div>
            </div>

            <Link
              to={`/facilities/${selectedFacility.id}`}
              className="w-full py-3 px-4 rounded-sm bg-[var(--ink)] hover:bg-[#1a1a1a] text-white font-semibold text-center text-sm shadow-sm transition disabled:opacity-50"
            >
              View Details & Reserve
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <Info className="w-10 h-10 text-[var(--muted)] mb-3" />
            <h4 className="text-sm font-medium text-[var(--ink)]">No facility selected</h4>
            <p className="text-xs text-[var(--muted)] mt-1 max-w-xs">
              Tap a room on the plan above to see its details and start a reservation request.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
