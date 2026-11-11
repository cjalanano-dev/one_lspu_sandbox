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
} from 'lucide-react'

import { dataStore } from '../../lib/dataStore'
import { facilityImageUrl } from '../../lib/facilityImages'
import { FloorPlanViewer } from '../../features/campus/FloorPlanViewer'
import type { Building, Floor, Facility } from '../../types'

const MAX_CHIPS_PER_CARD = 5

export function CampusExplorerPage() {
  const location = useLocation()

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

  // One-time load of every building, floor, and facility from Supabase.
  // Switching buildings is then instant (no extra round trips).
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
        setSelectedBuilding(found ?? bList[0])
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
        <div className="rounded-sm border border-[var(--line)] bg-[var(--paper)] p-6 text-center">
          <Info className="w-10 h-10 text-[var(--muted)] mx-auto mb-3" />
          <h3 className="font-bold text-[var(--ink)]">Something went wrong</h3>
          <p className="text-sm text-[var(--muted)] mt-1">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-sm border border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)] text-xs font-semibold duration-150 hover:bg-[var(--ink-dark)]"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  if (loading || !selectedBuilding) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--paper)]">
        <div className="flex flex-col items-center gap-3">
          <Compass className="w-8 h-8 text-[var(--ink)]" />
          <p className="text-xs text-[var(--muted)] uppercase tracking-widest font-medium">
            Loading campus…
          </p>
        </div>
      </div>
    )
  }

  const isSelectedBuilding = (b: Building) => selectedBuilding?.id === b.id

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--ink)] tracking-tighter leading-none flex items-center gap-2.5">
            <Compass className="w-7 h-7 text-[var(--ink)]" />
            Campus Explorer
          </h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Navigate buildings, explore floor layouts, and inspect university spaces.
          </p>
        </div>
      </div>

      {/* Buildings */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {buildings.map((b) => {
          const isSelected = isSelectedBuilding(b)
          const buildingFacs = facilitiesByBuilding.get(b.id) ?? []
          const visible = buildingFacs.slice(0, MAX_CHIPS_PER_CARD)
          const more = buildingFacs.length - MAX_CHIPS_PER_CARD
          const textColor = isSelected ? 'text-[var(--paper)]' : 'text-[var(--ink)]'
          const mutedColor = isSelected ? 'text-[var(--faint)]' : 'text-[var(--muted)]'

          return (
            <div
              key={b.id}
              role="button"
              tabIndex={0}
              aria-label={`Building ${b.code} — ${b.name}, ${buildingFacs.length} facilities`}
              onKeyDown={(e) => handleBuildingKeyDown(e, b)}
              onClick={() => setSelectedBuilding(b)}
              className={`p-4 rounded-sm border cursor-pointer transition duration-150 flex flex-col gap-3 min-h-[12rem] ${isSelected ? 'border-[var(--line-strong)] bg-[var(--line-strong)]' : 'border-[var(--line)] bg-[var(--paper)]'} ${textColor}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-sm flex items-center justify-center shrink-0 ${isSelected ? 'bg-[var(--paper)]' : 'bg-[var(--surface-2)] border border-[var(--line)]'}`}>
                  <Building2 className="w-5 h-5 text-[var(--ink)]" />
                </div>
                <div className="overflow-hidden flex-1 min-w-0">
                  <span className={`text-xs font-mono font-bold uppercase tracking-widest ${textColor}`}>
                    {b.code}
                  </span>
                  <h3 className={`font-bold text-sm truncate ${textColor}`}>{b.name}</h3>
                  <p className={`text-xs ${mutedColor} truncate flex items-center gap-1 mt-0.5`}>
                    <MapPin className="w-3 h-3 shrink-0" />
                    {b.location_description ?? 'Campus location'}
                  </p>
                </div>
                <span
                  className={`text-xs font-mono font-bold uppercase px-2 py-0.5 rounded-sm border shrink-0 ${isSelected ? 'border-[var(--paper)] text-[var(--ink)] bg-[var(--paper)]' : 'border-[var(--line)] text-[var(--ink)] bg-[var(--paper)]'}`}
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
                      className={`flex items-center gap-1 px-2 py-1 rounded-sm text-xs border shrink-0 ${isSelected ? 'border-[var(--paper)] text-[var(--ink)] bg-[var(--paper)]' : 'border-[var(--line)] bg-[var(--surface-2)] text-[var(--ink)]'}`}
                    >
                      <span className="truncate">{f.name}</span>
                      <span className={`text-xs leading-none font-mono font-bold uppercase opacity-60 ${textColor}`}>
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
                    className={`flex items-center gap-1 px-2 py-1 rounded-sm text-xs border shrink-0 ${isSelected ? 'border-[var(--paper)] text-[var(--ink)] bg-[var(--paper)]' : 'border-[var(--line)] bg-[var(--surface-2)] text-[var(--ink)]'}`}
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
          <div className="rounded-sm border border-[var(--line)] bg-[var(--paper)] p-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
              <span className="text-xs font-bold text-[var(--muted)] uppercase tracking-widest mr-1 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" />
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
                    className={`px-3.5 py-1.5 rounded-sm text-xs font-bold whitespace-nowrap transition duration-150 ${isSelected ? 'bg-[var(--line-strong)] text-[var(--paper)]' : 'border-[var(--line)] text-[var(--muted)] hover:bg-[var(--surface-2)]'}`}
                  >
                    {floorLabel(floor)}
                  </button>
                )
              })}
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 sm:w-48">
                <Search className="w-4 h-4 text-[var(--faint)] absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search room, code..."
                  aria-label="Search facilities"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-[var(--line)] rounded-sm bg-[var(--paper)] focus:border-[var(--line-strong)]"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-[var(--faint)]" />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  aria-label="Category filter"
                  className="border border-[var(--line)] rounded-sm text-xs py-2 px-3 font-medium text-[var(--ink)] bg-[var(--paper)] focus:border-[var(--line-strong)] appearance-none"
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

              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={() => setViewTab('this-floor')}
                  className={`px-3 py-1.5 rounded-sm text-xs font-bold transition duration-150 ${viewTab === 'this-floor' ? 'bg-[var(--line-strong)] text-[var(--paper)] border-[var(--line-strong)]' : 'border-[var(--line)] text-[var(--muted)] hover:bg-[var(--surface-2)]'}`}
                >
                  This floor ({facilitiesOnFloor.length})
                </button>
                <button
                  onClick={() => setViewTab('building')}
                  className={`px-3 py-1.5 rounded-sm text-xs font-bold transition duration-150 ${viewTab === 'building' ? 'bg-[var(--line-strong)] text-[var(--paper)] border-[var(--line-strong)]' : 'border-[var(--line)] text-[var(--muted)] hover:bg-[var(--surface-2)]'}`}
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
                <div className="rounded-sm border border-[var(--line)] p-6 flex flex-col justify-between">
                  {selectedFacility ? (
                    <div className="space-y-5">
                      <div className="relative rounded-sm overflow-hidden aspect-video bg-[var(--surface-2)] border border-[var(--line)]">
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
                          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-sm border border-[var(--muted)] text-[var(--muted)] text-xs font-bold uppercase">
                            Not on floor plan
                          </span>
                        )}
                        <span className="absolute top-2 right-2 px-2 py-0.5 rounded-sm text-xs font-bold uppercase bg-[var(--ink)] text-[var(--paper)] border border-[var(--ink)]">
                          {selectedFacility.facility_code}
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm border border-[var(--ink)] text-xs font-bold uppercase bg-[var(--ink)] text-[var(--paper)]">
                            {selectedFacility.category.replace('_', ' ')}
                          </span>
                          <span className={`flex items-center gap-1 ${statusTag(selectedFacility.status)}`}>
                            {selectedFacility.status}
                          </span>
                        </div>
                        <h4 className="text-lg font-bold text-[var(--ink)] mt-2">
                          {selectedFacility.name}
                        </h4>
                        <p className="text-xs text-[var(--muted)] mt-1 leading-relaxed">
                          {selectedFacility.description}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[var(--line)] text-xs">
                        <div className="border border-[var(--line)] p-2.5 rounded-sm bg-[var(--surface)]">
                          <span className="text-[var(--faint)] block font-medium">Capacity</span>
                          <span className="font-bold text-[var(--ink)] text-sm flex items-center gap-1.5 mt-0.5">
                            {selectedFacility.capacity} Seats
                          </span>
                        </div>
                        <div className="border border-[var(--line)] p-2.5 rounded-sm bg-[var(--surface)]">
                          <span className="text-[var(--faint)] block font-medium">Equipment</span>
                          <span className="font-bold text-[var(--ink)] text-sm flex items-center gap-1.5 mt-0.5">
                            {selectedFacility.equipment?.length || 0} Listed
                          </span>
                        </div>
                      </div>

                      <Link
                      to={`/facilities/${selectedFacility.id}`}
                      className="w-full inline-flex items-center justify-center gap-1.5 py-3 px-4 rounded-sm bg-[var(--ink)] hover:bg-[var(--ink-dark)] text-[var(--paper)] font-semibold text-sm transition-colors duration-150"
                    >
                      View Details & Reserve
                      <ArrowRight className="w-4 h-4 shrink-0" />
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
            </div>
          )}

          {/* Facility roster — real facility data, not a demo list */}
          {viewTab === 'building' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-[var(--ink)] uppercase tracking-widest">
                  All facilities in {selectedBuilding.name}
                </h2>
                <p className="text-xs text-[var(--muted)]">
                  {buildingFacilityCount} facility{buildingFacilityCount !== 1 ? 'ies' : ''}
                </p>
              </div>
              {buildingFloors.length === 0 ? (
                <div className="rounded-sm border border-[var(--line)] bg-[var(--paper)] p-6 text-center">
                  <Info className="w-8 h-8 text-[var(--muted)] mx-auto mb-3" />
                  <p className="text-sm text-[var(--muted)]">No floors found for this building.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {facilitiesByFloor.map(({ floor, facilities: floorFacs }) => {
                    const plotted = floorFacs.filter(hasMapPosition).length
                    return (
                      <div key={floor.id} className="border border-[var(--line)] rounded-sm overflow-hidden">
                        <div className="border-b border-[var(--line)] bg-[var(--surface-2)] px-4 py-2.5 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-1 h-4 rounded-sm bg-[var(--ink)]" />
                            <span className={`text-xs font-bold text-[var(--ink)] uppercase tracking-widest`}>
                              {floorLabel(floor)}
                            </span>
                          </div>
                          <span className="text-xs font-mono text-[var(--muted)]">
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
                                className={`w-full px-4 py-3 flex items-center justify-between border-b border-[var(--line)] last:border-0 hover:bg-[var(--surface-2)] transition duration-150 text-left ${selectedFacility?.id === f.id ? 'bg-[var(--surface-2)]' : ''}`}
                              >
                                <div className="flex items-center gap-3">
                                  <span className={statusTag(f.status)}>{f.status}</span>
                                  <div className="min-w-0 flex-1">
                                    <div className="font-bold text-[var(--ink)] text-sm truncate">
                                      {f.facility_code} — {f.name}
                                    </div>
                                    <div className="text-xs text-[var(--muted)] truncate">
                                      {f.category.replace('_', ' ')} · {f.capacity} seats
                                    </div>
                                  </div>
                                </div>
                                <span className={`text-xs font-bold uppercase ${hasMapPosition(f) ? 'text-[var(--ink)]' : 'text-[var(--muted)]'}`}>
                                  {hasMapPosition(f) ? 'On plan' : 'No plan location'}
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

          {/* Empty / no-plan-location state for the plan view */}
          {viewTab === 'this-floor' && selectedFloor && facilitiesOnFloor.length > 0 && plottedCount === 0 && (
            <div className="rounded-sm border border-[var(--line)] bg-[var(--surface-2)] p-6 text-center">
              <Info className="w-10 h-10 text-[var(--muted)] mx-auto mb-3" />
              <h4 className="text-sm font-medium text-[var(--ink)] mb-1">No floor-plan locations yet</h4>
              <p className="text-xs text-[var(--muted)] max-w-xs mx-auto">
                The facilities on {floorLabel(selectedFloor)} don't have floor-plan positions set. Use the
                <strong>Entire building</strong> tab to see them all.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
