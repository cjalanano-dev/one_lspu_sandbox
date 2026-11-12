import { useState, useEffect, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Building2,
  Layers,
  Search,
  Filter,
  Compass,
  MapPin,
  Info,
  ArrowRight,
  FileText,
} from 'lucide-react'

import { dataStore } from '../../lib/dataStore'
import { facilityImageUrl } from '../../lib/facilityImages'
import { FloorPlanViewer } from '../../features/campus/FloorPlanViewer'
import { InteractiveCampusMap } from '../../features/campus/InteractiveCampusMap'
import { REAL_CAMPUS_BUILDINGS, CampusMapBuilding } from '../../features/campus/campusMapData'
import { useAuth } from '../../features/auth/AuthContext'
import type { Building, Floor, Facility } from '../../types'

const MAX_CHIPS_PER_CARD = 5

export function CampusExplorerPage() {
  const location = useLocation()
  const { user, isApprover, isAdmin, isOfficer } = useAuth()
  const isPureSignatory = isApprover && !isAdmin

  const [buildings, setBuildings] = useState<Building[]>([])
  const [floors, setFloors] = useState<Floor[]>([])
  const [allFacilities, setAllFacilities] = useState<Facility[]>([])
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null)
  const [selectedFloor, setSelectedFloor] = useState<Floor | null>(null)
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null)

  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [viewTab, setViewTab] = useState<'this-floor' | 'building'>('this-floor')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      setError(null)
      try {
        const [bList, fList, facList] = await Promise.all([
          dataStore.getBuildings(),
          dataStore.getFloors(),
          dataStore.getFacilities(),
        ])
        setBuildings(bList)
        setFloors(fList)
        setAllFacilities(facList)

        const params = new URLSearchParams(location.search)
        const code = params.get('building')
        const found = code ? bList.find((b) => b.code === code) : null
        const initialBuilding = found ?? bList[0] ?? null
        setSelectedBuilding(initialBuilding)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load campus data.')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [location.search])

  const buildingFloors = useMemo(() => {
    if (!selectedBuilding) return []
    return floors
      .filter((f) => f.building_id === selectedBuilding.id)
      .sort((a, b) => a.floor_number - b.floor_number)
  }, [floors, selectedBuilding])

  // Auto-select first floor when building changes
  useEffect(() => {
    if (buildingFloors.length > 0) {
      setSelectedFloor((prev) => {
        if (prev && prev.building_id === selectedBuilding?.id) return prev
        return buildingFloors[0]
      })
    } else {
      setSelectedFloor(null)
    }
  }, [buildingFloors, selectedBuilding?.id])

  const floorById = useMemo(() => new Map(floors.map((f) => [f.id, f])), [floors])

  const facilitiesByBuilding = useMemo(() => {
    const map = new Map<string, Facility[]>()
    allFacilities.forEach((f) => {
      const list = map.get(f.building_id) ?? []
      list.push(f)
      map.set(f.building_id, list)
    })
    return map
  }, [allFacilities])

  const filteredFacilities = useMemo(() => {
    return allFacilities.filter((f) => {
      if (f.building_id !== selectedBuilding?.id) return false
      if (categoryFilter !== 'all' && f.category !== categoryFilter) return false
      if (searchQuery) {
        const term = searchQuery.toLowerCase()
        return (
          f.name.toLowerCase().includes(term) ||
          f.facility_code.toLowerCase().includes(term) ||
          f.description?.toLowerCase().includes(term)
        )
      }
      return true
    })
  }, [allFacilities, selectedBuilding, categoryFilter, searchQuery])

  const facilitiesOnFloor = useMemo(() => {
    if (!selectedFloor) return []
    return filteredFacilities.filter((f) => f.floor_id === selectedFloor.id)
  }, [filteredFacilities, selectedFloor])

  const facilitiesByFloor = useMemo(() => {
    const byFloor = new Map<string, { floor: Floor; facilities: Facility[] }>()
    buildingFloors.forEach((fl) => byFloor.set(fl.id, { floor: fl, facilities: [] }))
    filteredFacilities.forEach((f) => {
      const entry = byFloor.get(f.floor_id)
      if (entry) entry.facilities.push(f)
    })
    return [...byFloor.values()].sort(
      (a, b) => a.floor.floor_number - b.floor.floor_number,
    )
  }, [filteredFacilities, buildingFloors])

  const buildingFacilityCount = useMemo(() => filteredFacilities.length, [filteredFacilities])

  const hasMapPosition = (f: Facility) =>
    Boolean(
      f.map_position &&
        typeof f.map_position === 'object' &&
        f.map_position.x != null,
    )

  const plottedCount = useMemo(
    () => facilitiesOnFloor.filter(hasMapPosition).length,
    [facilitiesOnFloor],
  )

  const statusTag = (status: Facility['status']) => {
    switch (status) {
      case 'available': return 'tag tag-available'
      case 'reserved': return 'tag tag-reserved'
      case 'occupied': return 'tag tag-occupied'
      case 'maintenance': return 'tag tag-maintenance'
      default: return 'tag tag-rejected'
    }
  }

  const floorLabel = (floor: Floor) =>
    floor.name.split(' - ')[0]?.trim() || floor.name

  const handleBuildingKeyDown = (e: React.KeyboardEvent, b: Building) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setSelectedBuilding(b)
    }
  }

  const openFacilityAction = (b: Building, f: Facility) => {
    setSelectedBuilding(b)
    const floor = floorById.get(f.floor_id)
    if (floor) setSelectedFloor(floor)
    setSelectedFacility(f)
    setViewTab('this-floor')
  }

  const openFacility = (b: Building, f: Facility) => (e: React.MouseEvent) => {
    e.stopPropagation()
    openFacilityAction(b, f)
  }

  const selectFacility = (f: Facility) => {
    setSelectedFacility(f)
    if (selectedFloor && f.floor_id !== selectedFloor.id) {
      const floor = floors.find((fl) => fl.id === f.floor_id)
      if (floor) setSelectedFloor(floor)
    }
    setViewTab('this-floor')
  }

  if (error) {
    return (
      <div className="space-y-6 p-6">
        <div className="panel p-6 text-center">
          <Info className="w-10 h-10 text-[var(--muted)] mx-auto mb-3" />
          <h3 className="font-bold text-[var(--ink)]">Something went wrong</h3>
          <p className="text-sm text-[var(--muted)] mt-1">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 btn-primary text-xs"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  if (loading || !selectedBuilding) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Compass className="w-8 h-8 text-[var(--accent)]" />
          <p className="text-xs text-[var(--muted)] font-mono uppercase tracking-widest">
            Loading schematic campus map…
          </p>
        </div>
      </div>
    )
  }

  const isSelectedBuilding = (b: Building) => selectedBuilding?.id === b.id

  return (
    <div className="space-y-6">
      {/* Architectural Header Bar */}
      <div className="rounded-[var(--radius)] bg-[var(--ink)] text-[var(--paper)] p-6 border border-[var(--line-strong)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--paper)] tracking-tight flex items-center gap-2.5">
            <Compass className="w-6 h-6 text-[var(--accent-line)]" />
            Interactive Campus Explorer
          </h1>
          <p className="text-xs text-[var(--paper)]/75 mt-1">
            Select a campus building, switch floor levels, and inspect room capacities on the schematic floor plan.
          </p>
        </div>
        <Link to="/facilities" className="btn-accent text-xs gap-1.5 shrink-0">
          <Building2 className="w-4 h-4" /> Full Facilities Directory
        </Link>
      </div>

      {/* Interactive 2D Real Campus Map (LSPU San Pablo City Campus) */}
      <InteractiveCampusMap
        selectedBuildingCode={selectedBuilding?.code}
        onSelectBuilding={(mapBuilding: CampusMapBuilding) => {
          const matched = buildings.find(
            (b) => b.code.toLowerCase() === mapBuilding.code.toLowerCase() ||
                   b.name.toLowerCase().includes(mapBuilding.shortLabel.toLowerCase())
          )
          if (matched) {
            setSelectedBuilding(matched)
          } else {
            // Virtual fallback building for unseeded or auxiliary buildings
            setSelectedBuilding({
              id: mapBuilding.id,
              code: mapBuilding.code,
              name: mapBuilding.name,
              description: mapBuilding.description ?? null,
              location_description: 'LSPU San Pablo Campus',
              total_floors: mapBuilding.floors ?? 1,
              created_at: new Date().toISOString(),
            })
          }
        }}
      />

      {/* Building Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {buildings.map((b) => {
          const isSelected = isSelectedBuilding(b)
          const buildingFacs = facilitiesByBuilding.get(b.id) ?? []
          const visible = buildingFacs.slice(0, MAX_CHIPS_PER_CARD)
          const more = buildingFacs.length - MAX_CHIPS_PER_CARD
          const textColor = isSelected ? 'text-[var(--paper)]' : 'text-[var(--ink)]'
          const mutedColor = isSelected ? 'text-[var(--paper)]/70' : 'text-[var(--muted)]'

          return (
            <div
              key={b.id}
              role="button"
              tabIndex={0}
              aria-label={`Building ${b.code} — ${b.name}, ${buildingFacs.length} facilities`}
              onKeyDown={(e) => handleBuildingKeyDown(e, b)}
              onClick={() => setSelectedBuilding(b)}
              className={`p-4 rounded-[var(--radius)] border cursor-pointer transition duration-150 flex flex-col gap-3 min-h-[11.5rem] ${
                isSelected
                  ? 'border-[var(--accent)] bg-[var(--ink)] ring-1 ring-[var(--accent)] shadow-sm'
                  : 'border-[var(--line)] bg-[var(--paper)] hover:border-[var(--accent-line)]'
              } ${textColor}`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-[var(--radius)] flex items-center justify-center shrink-0 ${
                    isSelected
                      ? 'bg-[var(--ink-soft)] border border-[var(--accent)] text-[var(--accent-line)]'
                      : 'bg-[var(--surface)] border border-[var(--line)] text-[var(--ink)]'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                </div>
                <div className="overflow-hidden flex-1 min-w-0">
                  <span className={`text-[11px] font-mono font-bold uppercase tracking-widest ${isSelected ? 'text-[var(--accent-line)]' : 'text-[var(--accent-text)]'}`}>
                    {b.code}
                  </span>
                  <h3 className={`font-bold text-sm truncate ${textColor}`}>{b.name}</h3>
                  <p className={`text-xs ${mutedColor} truncate flex items-center gap-1 mt-0.5`}>
                    <MapPin className="w-3 h-3 shrink-0" />
                    {b.location_description ?? 'Campus location'}
                  </p>
                </div>
                <span
                  className={`text-xs font-mono font-bold uppercase px-2 py-0.5 rounded-xs border shrink-0 ${
                    isSelected
                      ? 'border-[var(--accent)]/40 text-[var(--accent-line)] bg-[var(--ink-soft)]'
                      : 'border-[var(--line)] text-[var(--ink)] bg-[var(--surface)]'
                  }`}
                >
                  {buildingFacs.length}
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {visible.map((f) => {
                  const floor = floorById.get(f.floor_id)
                  const badge = floor ? `${floor.floor_number}F` : '—'
                  return (
                    <span
                      key={f.id}
                      role="button"
                      tabIndex={0}
                      aria-label={`Open ${f.name} (${f.facility_code})`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          e.stopPropagation()
                          openFacilityAction(b, f)
                        }
                      }}
                      onClick={(e) => openFacility(b, f)(e as React.MouseEvent)}
                      className={`flex items-center gap-1 px-2 py-1 rounded-xs text-[11px] border shrink-0 transition ${
                        isSelected
                          ? 'border-[var(--ink-soft)] text-[var(--paper)]/90 bg-[var(--ink-soft)] hover:border-[var(--accent)]'
                          : 'border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--accent-line)]'
                      }`}
                    >
                      <span className="truncate max-w-[7rem]">{f.name}</span>
                      <span className="text-[10px] leading-none font-mono font-bold uppercase opacity-60">
                        {badge}
                      </span>
                    </span>
                  )
                })}
                {more > 0 && (
                  <span
                    role="button"
                    tabIndex={0}
                    aria-label={`View all ${buildingFacs.length} facilities in ${b.name}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        e.stopPropagation()
                        setSelectedBuilding(b)
                        setViewTab('building')
                      }
                    }}
                    onClick={() => {
                      setSelectedBuilding(b)
                      setViewTab('building')
                    }}
                    className={`flex items-center gap-1 px-2 py-1 rounded-xs text-[11px] font-mono border shrink-0 ${
                      isSelected
                        ? 'border-[var(--accent)]/40 text-[var(--accent-line)] bg-[var(--ink-soft)]'
                        : 'border-[var(--line)] bg-[var(--surface)] text-[var(--ink)]'
                    }`}
                  >
                    +{more}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {selectedBuilding && (
        <>
          {/* Floors + search + filters + view tabs */}
          <div className="panel p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0">
              <span className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider mr-1 flex items-center gap-1 shrink-0">
                <Layers className="w-3.5 h-3.5 text-[var(--accent)]" />
                Levels:
              </span>
              {buildingFloors.map((floor) => {
                const isSelected = selectedFloor?.id === floor.id
                return (
                  <button
                    key={floor.id}
                    onClick={() => {
                      setSelectedFloor(floor)
                      setSelectedFacility(null)
                    }}
                    aria-pressed={isSelected}
                    className={`px-3.5 py-1.5 rounded-[var(--radius)] text-xs font-bold whitespace-nowrap transition duration-150 shrink-0 ${
                      isSelected
                        ? 'bg-[var(--ink)] text-[var(--paper)] border border-[var(--accent)]'
                        : 'border border-[var(--line)] text-[var(--muted)] hover:bg-[var(--accent-tint)] hover:text-[var(--accent-text)]'
                    }`}
                  >
                    {floorLabel(floor)}
                  </button>
                )
              })}
            </div>

            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 w-full lg:w-auto">
              <div className="relative flex-1 sm:w-48">
                <Search className="w-4 h-4 text-[var(--faint)] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search room, code..."
                  aria-label="Search facilities"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-[var(--line)] rounded-[var(--radius)] bg-[var(--paper)] focus:border-[var(--accent)]"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-[var(--faint)] shrink-0" />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  aria-label="Category filter"
                  className="w-full sm:w-auto border border-[var(--line)] rounded-[var(--radius)] text-xs py-2 px-3 font-medium text-[var(--ink)] bg-[var(--paper)] focus:border-[var(--accent)]"
                >
                  <option value="all">All categories</option>
                  <option value="auditorium">Auditorium</option>
                  <option value="conference_room">Conference</option>
                  <option value="laboratory">Laboratory</option>
                  <option value="lecture_hall">Lecture Hall</option>
                  <option value="multipurpose">Multipurpose</option>
                  <option value="sports_gym">Sports Gym</option>
                </select>
              </div>

              <div className="grid grid-cols-2 sm:flex items-center gap-1.5 sm:ml-auto">
                <button
                  onClick={() => setViewTab('this-floor')}
                  className={`px-3 py-1.5 rounded-[var(--radius)] text-xs font-bold transition duration-150 ${
                    viewTab === 'this-floor'
                      ? 'bg-[var(--accent)] text-[var(--accent-ink)]'
                      : 'border border-[var(--line)] text-[var(--muted)] hover:bg-[var(--surface-2)]'
                  }`}
                >
                  This floor ({facilitiesOnFloor.length})
                </button>
                <button
                  onClick={() => setViewTab('building')}
                  className={`px-3 py-1.5 rounded-[var(--radius)] text-xs font-bold transition duration-150 ${
                    viewTab === 'building'
                      ? 'bg-[var(--accent)] text-[var(--accent-ink)]'
                      : 'border border-[var(--line)] text-[var(--muted)] hover:bg-[var(--surface-2)]'
                  }`}
                >
                  Entire building ({buildingFacilityCount})
                </button>
              </div>
            </div>
          </div>

          {/* Floor plan + detail panel */}
          {viewTab === 'this-floor' && selectedFloor && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7">
                <FloorPlanViewer
                  floor={selectedFloor}
                  facilities={allFacilities}
                  selectedFacility={selectedFacility}
                  onSelectFacility={selectFacility}
                />
              </div>
              <div className="lg:col-span-5">
                <div className="panel p-6 h-full flex flex-col justify-between">
                  {selectedFacility ? (
                    <div className="space-y-5">
                      <div className="relative rounded-[var(--radius)] overflow-hidden aspect-video bg-[var(--surface-2)] border border-[var(--line)]">
                        <img
                          src={facilityImageUrl(selectedFacility)}
                          alt={selectedFacility.name}
                          className="w-full h-full object-cover grayscale"
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.src = facilityImageUrl({
                              image_url: null,
                              category: 'multipurpose',
                            })
                          }}
                        />
                        {hasMapPosition(selectedFacility) ? null : (
                          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-xs bg-[var(--ink)]/80 text-[var(--paper)] text-[10px] font-mono uppercase">
                            Not on floor plan
                          </span>
                        )}
                        <span className="absolute top-2 right-2 px-2.5 py-0.5 rounded-xs text-xs font-mono font-bold uppercase bg-[var(--ink)] text-[var(--accent-line)] border border-[var(--accent)]/40">
                          {selectedFacility.facility_code}
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs border border-[var(--line)] text-[11px] font-mono font-semibold uppercase bg-[var(--surface)] text-[var(--ink)]">
                            {selectedFacility.category.replace('_', ' ')}
                          </span>
                          <span className={`flex items-center gap-1 ${statusTag(selectedFacility.status)}`}>
                            {selectedFacility.status}
                          </span>
                        </div>
                        <h4 className="text-lg font-extrabold text-[var(--ink)] mt-2">
                          {selectedFacility.name}
                        </h4>
                        <p className="text-xs text-[var(--muted)] mt-1 leading-relaxed">
                          {selectedFacility.description}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[var(--line)] text-xs">
                        <div className="border border-[var(--line)] p-3 rounded-[var(--radius)] bg-[var(--surface)]">
                          <span className="text-[var(--faint)] block font-mono uppercase text-[10px]">Max Capacity</span>
                          <span className="font-bold text-[var(--ink)] text-sm flex items-center gap-1.5 mt-0.5">
                            {selectedFacility.capacity} Seats
                          </span>
                        </div>
                        <div className="border border-[var(--line)] p-3 rounded-[var(--radius)] bg-[var(--surface)]">
                          <span className="text-[var(--faint)] block font-mono uppercase text-[10px]">Equipment</span>
                          <span className="font-bold text-[var(--ink)] text-sm flex items-center gap-1.5 mt-0.5">
                            {selectedFacility.equipment?.length || 0} Listed
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 pt-2">
                        {isOfficer && (
                          <Link
                            to={`/proposals/new?facility=${selectedFacility.id}`}
                            className="w-full btn-accent gap-1.5 py-3 text-center justify-center font-bold"
                          >
                            <FileText className="w-4 h-4 shrink-0" />
                            File Event Proposal for this Room
                          </Link>
                        )}
                        <Link
                          to={`/facilities/${selectedFacility.id}`}
                          className="w-full btn-primary gap-1.5 py-3 text-center justify-center"
                        >
                          {isPureSignatory
                            ? 'Inspect Venue Schedule & Specs'
                            : 'View Details & Book Regular Reservation'}
                          <ArrowRight className="w-4 h-4 shrink-0" />
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8">
                      <Info className="w-10 h-10 text-[var(--muted)] mb-3" />
                      <h4 className="text-sm font-bold text-[var(--ink)]">No facility selected</h4>
                      <p className="text-xs text-[var(--muted)] mt-1 max-w-xs">
                        Select a room on the schematic floor plan to inspect its capacity, equipment, and schedule.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Facility roster */}
          {viewTab === 'building' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold text-[var(--ink)] uppercase tracking-widest">
                  All facilities in {selectedBuilding.name}
                </h2>
                <p className="text-xs font-mono text-[var(--muted)]">
                  {buildingFacilityCount} mapped spaces
                </p>
              </div>
              {buildingFloors.length === 0 ? (
                <div className="panel p-6 text-center">
                  <Info className="w-8 h-8 text-[var(--muted)] mx-auto mb-3" />
                  <p className="text-sm text-[var(--muted)]">No floors found for this building.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {facilitiesByFloor.map(({ floor, facilities: floorFacs }) => {
                    const plotted = floorFacs.filter(hasMapPosition).length
                    return (
                      <div key={floor.id} className="panel overflow-hidden">
                        <div className="border-b border-[var(--line)] bg-[var(--ink)] text-[var(--paper)] px-4 py-2.5 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-3.5 rounded-xs bg-[var(--accent)]" />
                            <span className="text-xs font-bold uppercase tracking-widest">
                              {floorLabel(floor)}
                            </span>
                          </div>
                          <span className="text-xs font-mono text-[var(--paper)]/70">
                            {plotted}/{floorFacs.length} on plan
                          </span>
                        </div>
                        <div className="divide-y divide-[var(--line)]">
                          {floorFacs.length === 0 ? (
                            <div className="px-4 py-3 text-center">
                              <p className="text-xs text-[var(--muted)]">No facilities</p>
                            </div>
                          ) : (
                            floorFacs.map((f) => (
                              <button
                                key={f.id}
                                onClick={() => selectFacility(f)}
                                className={`w-full px-4 py-3 flex items-center justify-between hover:bg-[var(--accent-tint)] transition duration-150 text-left ${
                                  selectedFacility?.id === f.id ? 'bg-[var(--accent-tint)]' : ''
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <span className={statusTag(f.status)}>{f.status}</span>
                                  <div className="min-w-0 flex-1">
                                    <div className="font-bold text-[var(--ink)] text-sm truncate">
                                      <span className="font-mono text-[var(--accent-text)]">{f.facility_code}</span> — {f.name}
                                    </div>
                                    <div className="text-xs text-[var(--muted)] truncate">
                                      {f.category.replace('_', ' ')} · {f.capacity} seats
                                    </div>
                                  </div>
                                </div>
                                <span className={`text-xs font-mono font-semibold uppercase ${hasMapPosition(f) ? 'text-[var(--accent-text)]' : 'text-[var(--muted)]'}`}>
                                  {hasMapPosition(f) ? 'On plan →' : 'No plan location'}
                                </span>
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {viewTab === 'this-floor' && selectedFloor && facilitiesOnFloor.length > 0 && plottedCount === 0 && (
            <div className="panel p-6 text-center">
              <Info className="w-10 h-10 text-[var(--muted)] mx-auto mb-3" />
              <h4 className="text-sm font-medium text-[var(--ink)] mb-1">No floor-plan locations yet</h4>
              <p className="text-xs text-[var(--muted)] max-w-xs mx-auto">
                The facilities on {floorLabel(selectedFloor)} don't have floor-plan positions set. Use the{' '}
                <strong>Entire building</strong> tab to see them all.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
