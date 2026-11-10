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
      <div className="w-full lg:flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
              {floor.name}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Select any facility on the plan to inspect details and check its schedule
            </p>
          </div>
          <span className="text-xs font-mono font-medium bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md">
            Interactive 2D Plan
          </span>
        </div>

        <div className="relative aspect-[16/10] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-inner flex items-center justify-center">
          <div
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, #38bdf8 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

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
              fill="#090d16"
              stroke="#1e293b"
              strokeWidth="1.2"
              strokeDasharray="2,2"
            />

            {/* Central Corridor */}
            <rect
              x="10"
              y={VIEWBOX_H * 0.45}
              width={VIEWBOX_W - 20}
              height={VIEWBOX_H * 0.12}
              fill="#0f172a"
              stroke="#334155"
              strokeWidth="0.5"
            />
            <text
              x={VIEWBOX_W / 2}
              y={VIEWBOX_H * 0.5}
              fill="#475569"
              fontSize="2.5"
              fontFamily="sans-serif"
              textAnchor="middle"
              dominantBaseline="middle"
              className="tracking-widest uppercase font-semibold pointer-events-none"
            >
              Main Central Concourse
            </text>

            {/* Render Facility Rooms */}
            {floorFacilities.map((facility) => {
              const pos = normalizePosition(facility.map_position)
              const isSelected = selectedFacility?.id === facility.id
              const isHovered = hoveredFacility?.id === facility.id

              let fillColor = '#1e293b'
              let strokeColor = '#3b82f6'

              if (facility.status === 'maintenance') {
                fillColor = isSelected ? '#581c87' : '#2e1065'
                strokeColor = '#a855f7'
              } else if (isSelected) {
                fillColor = '#0369a1'
                strokeColor = '#38bdf8'
              } else if (isHovered) {
                fillColor = '#1e3a8a'
                strokeColor = '#60a5fa'
              }

              const centerX = pos.x + pos.width / 2
              const centerY = pos.y + pos.height / 2

              return (
                <g
                  key={facility.id}
                  onClick={() => onSelectFacility(facility)}
                  onKeyDown={(e) => handleRoomKeyDown(e, facility)}
                  onMouseEnter={() => setHoveredFacility(facility)}
                  onMouseLeave={() => setHoveredFacility(null)}
                  className="cursor-pointer transition-all duration-200 focus-visible:outline-none"
                  tabIndex={0}
                  role="button"
                  aria-label={facility.facility_code}
                  aria-pressed={isSelected ? 'true' : 'false'}
                >
                  {/* Room Box */}
                  <rect
                    x={pos.x}
                    y={pos.y}
                    width={pos.width}
                    height={pos.height}
                    rx="1.5"
                    fill={fillColor}
                    stroke={strokeColor}
                    strokeWidth={isSelected ? '1' : isHovered ? '0.8' : '0.5'}
                    className="transition-colors duration-150"
                  />

                  {/* Room Identifier Label */}
                  <text
                    x={centerX}
                    y={centerY - 1.5}
                    fill="#f8fafc"
                    fontSize="2.4"
                    fontWeight="bold"
                    fontFamily="sans-serif"
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
                    fill="#94a3b8"
                    fontSize="1.8"
                    fontFamily="sans-serif"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="pointer-events-none capitalize"
                  >
                    {facility.category.replace('_', ' ')}
                  </text>

                  {/* Capacity indicator icon tag */}
                  <circle
                    cx={pos.x + pos.width - 2.5}
                    cy={pos.y + 2.5}
                    r="1.2"
                    fill={facility.status === 'maintenance' ? '#f59e0b' : '#10b981'}
                  />
                </g>
              )
            })}
          </svg>

          {floorFacilities.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <Info className="w-10 h-10 text-slate-500 mb-3" />
              <h4 className="text-sm font-medium text-slate-900">No facilities on this floor</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                {floor.name} doesn't have any rooms drawn yet. Use the facility list below instead.
              </p>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-3">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-sky-600 border border-sky-400 inline-block"></span>
              Selected
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-slate-800 border border-blue-500 inline-block"></span>
              Available Facility
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-purple-900 border border-purple-500 inline-block"></span>
              Under Maintenance
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            {floorFacilities.length} facilities on this level
          </span>
        </div>
      </div>

      {/* Selected Facility Detail Preview Panel */}
      <div className="w-full lg:w-96 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
        {selectedFacility ? (
          <div className="space-y-5">
            <div className="relative rounded-xl overflow-hidden aspect-video bg-slate-100">
              {selectedFacility.image_url ? (
                <img
                  src={selectedFacility.image_url}
                  alt={selectedFacility.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full bg-slate-200 flex items-center justify-center">
                  <Building2 className="w-12 h-12 text-slate-400" />
                </div>
              )}
              <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-xs font-semibold uppercase bg-slate-900/80 backdrop-blur text-white">
                {selectedFacility.facility_code}
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-sky-50 text-sky-700 capitalize">
                  {selectedFacility.category.replace('_', ' ')}
                </span>
                <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Reservable
                </span>
              </div>
              <h4 className="text-lg font-bold text-slate-900 mt-2">{selectedFacility.name}</h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {selectedFacility.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-slate-400 block font-medium">Capacity</span>
                <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5 mt-0.5">
                  <Users className="w-3.5 h-3.5 text-sky-600" />
                  {selectedFacility.capacity} Seats
                </span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-slate-400 block font-medium">Equipment</span>
                <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5 mt-0.5">
                  <Cpu className="w-3.5 h-3.5 text-indigo-600" />
                  {selectedFacility.equipment?.length || 0} Listed
                </span>
              </div>
            </div>

            <Link
              to={`/facilities/${selectedFacility.id}`}
              className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-center shadow-md transition disabled:opacity-50"
            >
              View Details & Reserve
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <Info className="w-10 h-10 text-slate-500 mb-3" />
            <h4 className="text-sm font-medium text-slate-900">No facility selected</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-xs">
              Tap a room on the plan above to see its details and start a reservation request.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
