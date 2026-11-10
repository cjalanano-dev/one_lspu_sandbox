import React, { useState } from 'react'
import { Info, Users, Cpu, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export function FloorPlanViewer({ floor, facilities, selectedFacility, onSelectFacility }) {
  const [hoveredFacility, setHoveredFacility] = useState(null)

  // Facilities on this floor
  const floorFacilities = facilities.filter((f) => f.floor_id === floor.id)

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
              Click on any facility highlighted in the floor plan to inspect details and check schedule
            </p>
          </div>
          <span className="text-xs font-mono font-medium bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md">
            Interactive 2D Plan
          </span>
        </div>

        {/* SVG Container with architectural grid styling */}
        <div className="relative aspect-[16/10] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-inner flex items-center justify-center">
          {/* Subtle Grid overlay */}
          <div 
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, #38bdf8 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          <svg
            viewBox="0 0 100 70"
            className="w-full h-full select-none"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Building Perimeter outline */}
            <rect
              x="5"
              y="5"
              width="90"
              height="60"
              rx="2"
              fill="#090d16"
              stroke="#1e293b"
              strokeWidth="1.2"
              strokeDasharray="2,2"
            />

            {/* Central Corridor */}
            <rect
              x="10"
              y="32"
              width="80"
              height="8"
              fill="#0f172a"
              stroke="#334155"
              strokeWidth="0.5"
            />
            <text
              x="50"
              y="37"
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
              const pos = facility.map_position || { x: 10, y: 10, width: 25, height: 20 }
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

              return (
                <g
                  key={facility.id}
                  onClick={() => onSelectFacility(facility)}
                  onMouseEnter={() => setHoveredFacility(facility)}
                  onMouseLeave={() => setHoveredFacility(null)}
                  className="cursor-pointer transition-all duration-200"
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
                    x={pos.x + pos.width / 2}
                    y={pos.y + pos.height / 2 - 1.5}
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
                    x={pos.x + pos.width / 2}
                    y={pos.y + pos.height / 2 + 2.5}
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
              <img
                src={selectedFacility.image_url}
                alt={selectedFacility.name}
                className="w-full h-full object-cover"
              />
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

            {selectedFacility.rules && (
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="leading-snug">{selectedFacility.rules}</p>
              </div>
            )}

            <div className="pt-2">
              <Link
                to={`/facilities/${selectedFacility.id}`}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-sm shadow-md shadow-sky-600/20 transition"
              >
                View Schedule & Reserve
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="py-16 text-center text-slate-400 flex flex-col items-center">
            <Info className="w-10 h-10 text-slate-300 mb-3" />
            <h4 className="font-semibold text-slate-700 text-sm">No Facility Selected</h4>
            <p className="text-xs text-slate-400 max-w-xs mt-1">
              Select any room inside the architectural plan or list to view specifications and launch reservations.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
