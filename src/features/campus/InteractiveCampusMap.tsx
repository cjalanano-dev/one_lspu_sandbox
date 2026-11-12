import React, { useState } from 'react'
import { REAL_CAMPUS_BUILDINGS, CampusMapBuilding } from './campusMapData'
import { Building2, Navigation, MapPin, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'

interface InteractiveCampusMapProps {
  selectedBuildingCode?: string | null
  onSelectBuilding: (building: CampusMapBuilding) => void
}

export const InteractiveCampusMap: React.FC<InteractiveCampusMapProps> = ({
  selectedBuildingCode,
  onSelectBuilding,
}) => {
  const [hoveredBuilding, setHoveredBuilding] = useState<CampusMapBuilding | null>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })

  const handleZoom = (delta: number) => {
    setZoom((prev) => Math.min(Math.max(0.8, prev + delta), 2.0))
  }

  const handleReset = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  return (
    <div className="relative w-full rounded-[var(--radius)] overflow-hidden border border-[var(--line)] bg-[var(--surface-2)] shadow-inner select-none">
      {/* Map Header Toolbar */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 bg-[var(--ink)]/90 backdrop-blur-md px-3 py-1.5 rounded-[var(--radius)] border border-[var(--ink-soft)] text-[var(--paper)] text-xs pointer-events-auto shadow-sm">
          <Navigation className="w-3.5 h-3.5 text-[var(--accent)]" />
          <span className="font-bold tracking-wide uppercase text-[11px]">
            LSPU San Pablo Campus Map
          </span>
          <span className="text-[var(--paper)]/50 hidden sm:inline">· Click any building to inspect</span>
        </div>

        {/* Map Controls */}
        <div className="flex items-center gap-1.5 bg-[var(--paper)] p-1 rounded-[var(--radius)] border border-[var(--line)] shadow-sm pointer-events-auto">
          <button
            type="button"
            onClick={() => handleZoom(0.2)}
            className="p-1.5 hover:bg-[var(--surface)] text-[var(--ink)] rounded-xs transition"
            title="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleZoom(-0.2)}
            className="p-1.5 hover:bg-[var(--surface)] text-[var(--ink)] rounded-xs transition"
            title="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="p-1.5 hover:bg-[var(--surface)] text-[var(--ink)] rounded-xs transition"
            title="Reset map view"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="w-full aspect-[4/3] max-h-[640px] overflow-hidden flex items-center justify-center bg-[#131b2b]">
        <svg
          viewBox="0 0 1000 1000"
          className="w-full h-full cursor-grab active:cursor-grabbing transition-transform duration-200"
          style={{ transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)` }}
        >
          <defs>
            {/* Campus Background Pattern */}
            <radialGradient id="campusBg" cx="50%" cy="50%" r="70%">
              <stop offset="0%" stopColor="#1a2538" />
              <stop offset="100%" stopColor="#0c1322" />
            </radialGradient>

            {/* Grass Pattern */}
            <pattern id="grassPattern" width="20" height="20" patternUnits="userSpaceOnUse">
              <rect width="20" height="20" fill="#4d7c0f" opacity="0.35" />
              <circle cx="5" cy="5" r="1.5" fill="#65a30d" opacity="0.5" />
              <circle cx="15" cy="15" r="1.5" fill="#65a30d" opacity="0.5" />
            </pattern>

            {/* Water / Pool Pattern */}
            <pattern id="waterPattern" width="16" height="16" patternUnits="userSpaceOnUse">
              <rect width="16" height="16" fill="#0284c7" />
              <path d="M 0 8 Q 4 4, 8 8 T 16 8" fill="none" stroke="#38bdf8" strokeWidth="1.5" opacity="0.7" />
            </pattern>

            {/* Drop Shadows */}
            <filter id="buildingShadow" x="-10%" y="-10%" width="125%" height="125%">
              <feDropShadow dx="3" dy="4" stdDeviation="3" floodColor="#000000" floodOpacity="0.45" />
            </filter>
            <filter id="activeGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#38bdf8" floodOpacity="0.8" />
            </filter>
          </defs>

          {/* 1. Deep Campus Base Ground */}
          <rect width="1000" height="1000" fill="url(#campusBg)" />

          {/* 2. Campus Boundary Perimeter Envelope */}
          <path
            d="M 120 140
               L 660 140
               L 660 320
               L 700 320
               L 700 460
               L 820 460
               L 820 640
               L 560 640
               L 560 720
               L 400 720
               L 400 920
               L 160 920
               L 160 140 Z"
            fill="#222f47"
            stroke="#3a4d6f"
            strokeWidth="8"
            strokeLinejoin="round"
          />

          {/* 3. Internal Walkways and Roadways (Gray/Asphalt) */}
          {/* Main Southern Avenue from Entrance */}
          <rect x="315" y="550" width="45" height="370" fill="#334155" />
          {/* Cross Street to Research */}
          <rect x="315" y="680" width="85" height="40" fill="#334155" />
          {/* Central Arterial Spine (North-South) */}
          <rect x="330" y="240" width="30" height="320" fill="#334155" />
          {/* West Arterial Strip */}
          <rect x="225" y="240" width="25" height="330" fill="#334155" />
          {/* East-West Corridors */}
          <rect x="140" y="270" width="220" height="25" fill="#334155" />
          <rect x="330" y="520" width="330" height="30" fill="#334155" />
          <rect x="500" y="240" width="35" height="310" fill="#334155" />
          <rect x="140" y="430" width="100" height="20" fill="#334155" />

          {/* 4. Green Grounds, Oval, Courtyards */}
          {/* Central Field / Quadrangle */}
          <rect x="360" y="360" width="140" height="160" rx="8" fill="url(#grassPattern)" stroke="#65a30d" strokeWidth="2" />
          {/* Volleyball / Sand Court inside Field */}
          <rect x="475" y="380" width="55" height="85" rx="4" fill="#d97706" opacity="0.65" stroke="#f59e0b" strokeWidth="1.5" />

          {/* Swimming Pool Area */}
          <rect x="625" y="350" width="55" height="110" rx="6" fill="url(#waterPattern)" stroke="#0284c7" strokeWidth="2" />

          {/* Tree Clusters & Foliage Accents */}
          {[
            { cx: 200, cy: 300, r: 18 },
            { cx: 275, cy: 260, r: 16 },
            { cx: 270, cy: 460, r: 20 },
            { cx: 295, cy: 475, r: 18 },
            { cx: 200, cy: 615, r: 20 },
            { cx: 215, cy: 745, r: 20 },
            { cx: 235, cy: 825, r: 18 },
            { cx: 520, cy: 300, r: 22 },
            { cx: 550, cy: 500, r: 20 },
            { cx: 535, cy: 625, r: 22 },
            { cx: 375, cy: 610, r: 18 },
            { cx: 605, cy: 210, r: 22 },
            { cx: 750, cy: 510, r: 24 },
          ].map((t, idx) => (
            <g key={`tree-${idx}`}>
              <circle cx={t.cx + 2} cy={t.cy + 3} r={t.r} fill="#14532d" opacity="0.5" />
              <circle cx={t.cx} cy={t.cy} r={t.r} fill="#22c55e" opacity="0.85" />
              <circle cx={t.cx - 3} cy={t.cy - 3} r={t.r * 0.7} fill="#4ade80" opacity="0.9" />
            </g>
          ))}

          {/* 5. Buildings Footprints */}
          {REAL_CAMPUS_BUILDINGS.map((b) => {
            const isSelected = selectedBuildingCode === b.code
            const isHovered = hoveredBuilding?.code === b.code

            // Palette fills
            let fill = '#ea580c' // Default campus orange/terracotta from reference
            let stroke = '#c2410c'

            if (b.category === 'sports') {
              fill = '#0284c7'
              stroke = '#0369a1'
            } else if (b.category === 'admin') {
              fill = '#d97706'
              stroke = '#b45309'
            } else if (b.code === 'NEW-CCS' || b.code === 'COE') {
              fill = '#f97316'
              stroke = '#ea580c'
            }

            if (isSelected) {
              fill = '#38bdf8'
              stroke = '#0284c7'
            } else if (isHovered) {
              fill = '#fb923c'
            }

            return (
              <g
                key={b.id}
                className="cursor-pointer transition-all duration-150"
                onClick={() => onSelectBuilding(b)}
                onMouseEnter={() => setHoveredBuilding(b)}
                onMouseLeave={() => setHoveredBuilding(null)}
                filter={isSelected ? 'url(#activeGlow)' : 'url(#buildingShadow)'}
              >
                {/* 3D Isometric Wall Facet */}
                <rect
                  x={b.x + 3}
                  y={b.y + 4}
                  width={b.width}
                  height={b.height}
                  rx={4}
                  fill="#7c2d12"
                  opacity={isSelected ? 0.3 : 0.8}
                />
                {/* Building Roof */}
                <rect
                  x={b.x}
                  y={b.y}
                  width={b.width}
                  height={b.height}
                  rx={4}
                  fill={fill}
                  stroke={isSelected ? '#ffffff' : stroke}
                  strokeWidth={isSelected ? 3 : 1.5}
                />

                {/* Building Label */}
                <text
                  x={b.x + b.width / 2}
                  y={b.y + b.height / 2 - (b.height > 60 ? 4 : 0)}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#ffffff"
                  fontSize={b.width < 80 || b.height < 50 ? 9 : 10.5}
                  fontWeight="800"
                  fontFamily="system-ui, sans-serif"
                  letterSpacing="0.02em"
                  className="pointer-events-none drop-shadow-sm uppercase"
                >
                  {b.shortLabel.split(' ')[0]}
                </text>
                {b.shortLabel.split(' ').length > 1 && (
                  <text
                    x={b.x + b.width / 2}
                    y={b.y + b.height / 2 + 9}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#ffffff"
                    fontSize={b.width < 80 || b.height < 50 ? 7.5 : 9}
                    fontWeight="700"
                    fontFamily="system-ui, sans-serif"
                    className="pointer-events-none drop-shadow-sm uppercase"
                  >
                    {b.shortLabel.split(' ').slice(1).join(' ')}
                  </text>
                )}
              </g>
            )
          })}

          {/* 6. Campus Entrance Marker & Pin */}
          <g transform="translate(335, 870)">
            <circle cx="0" cy="0" r="28" fill="#ef4444" opacity="0.3" className="animate-ping" />
            <path
              d="M 0 -22 C -12 -22 -22 -12 -22 0 C -22 14 0 32 0 32 C 0 32 22 14 22 0 C 22 -12 12 -22 0 -22 Z"
              fill="#ef4444"
              stroke="#b91c1c"
              strokeWidth="2"
            />
            <circle cx="0" cy="-4" r="7" fill="#ffffff" />
            <text
              x="0"
              y="-3"
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#b91c1c"
              fontSize="7"
              fontWeight="900"
            >
              ★
            </text>
            <rect x="-35" y="36" width="70" height="18" rx="3" fill="#0f172a" opacity="0.85" />
            <text
              x="0"
              y="46"
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#ffffff"
              fontSize="8.5"
              fontWeight="800"
              letterSpacing="0.05em"
            >
              ENTRANCE
            </text>
          </g>
        </svg>
      </div>

      {/* Hover Info Tooltip Bar */}
      <div className="p-3 bg-[var(--paper)] border-t border-[var(--line)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
        {hoveredBuilding || selectedBuildingCode ? (
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[var(--accent)]" />
            <span className="font-extrabold text-[var(--ink)]">
              {(hoveredBuilding || REAL_CAMPUS_BUILDINGS.find((b) => b.code === selectedBuildingCode))?.name}
            </span>
            <span className="font-mono text-[10px] text-[var(--accent-text)] bg-[var(--surface)] px-1.5 py-0.5 rounded-xs border border-[var(--line)]">
              {(hoveredBuilding || REAL_CAMPUS_BUILDINGS.find((b) => b.code === selectedBuildingCode))?.code}
            </span>
            <span className="text-[var(--muted)] text-[11px] hidden md:inline">
              {(hoveredBuilding || REAL_CAMPUS_BUILDINGS.find((b) => b.code === selectedBuildingCode))?.description}
            </span>
          </div>
        ) : (
          <div className="text-[var(--muted)] flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Hover or click any building above to load its rooms, laboratories, and floor plans.</span>
          </div>
        )}

        <div className="text-[10px] text-[var(--muted)] font-mono self-end sm:self-auto">
          LSPU San Pablo Campus · Scale 1:1000
        </div>
      </div>
    </div>
  )
}
