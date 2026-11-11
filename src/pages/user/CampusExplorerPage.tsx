import { useState, useEffect } from 'react'
import { Building2, Layers, Search, Filter, Compass, MapPin } from 'lucide-react'
import { dataStore } from '../../lib/dataStore'
import { FloorPlanViewer } from '../../features/campus/FloorPlanViewer'
import { useSearchParams } from 'react-router-dom'
import type { Building, Floor, Facility } from '../../types'

export function CampusExplorerPage() {
  const [searchParams] = useSearchParams()
  const requestedBuildingCode = searchParams.get('building')
  const [buildings, setBuildings] = useState<Building[]>([])
  const [floors, setFloors] = useState<Floor[]>([])
  const [facilities, setFacilities] = useState<Facility[]>([])

  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null)
  const [selectedFloor, setSelectedFloor] = useState<Floor | null>(null)
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null)

  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')

  useEffect(() => {
    async function loadData() {
      const bList = await dataStore.getBuildings()
      setBuildings(bList)
      if (bList.length === 0) return
      if (requestedBuildingCode) {
        const match = bList.find(
          (b) => b.code === requestedBuildingCode || b.id === requestedBuildingCode
        )
        setSelectedBuilding(match ?? bList[0])
      } else {
        setSelectedBuilding(bList[0])
      }
    }
    loadData()
  }, [requestedBuildingCode])

  useEffect(() => {
    async function loadFloors() {
      if (!selectedBuilding) return
      const fList = await dataStore.getFloors(selectedBuilding.id)
      setFloors(fList)
      if (fList.length > 0) {
        setSelectedFloor(fList[0])
      }
    }
    loadFloors()
  }, [selectedBuilding])

  useEffect(() => {
    async function loadFacilities() {
      if (!selectedBuilding) return
      const facList = await dataStore.getFacilities({
        buildingId: selectedBuilding.id,
        floorId: selectedFloor?.id ?? undefined,
        category: categoryFilter,
        search: searchQuery,
      })
      setFacilities(facList)
      if (facList.length > 0) {
        setSelectedFacility(facList[0])
      } else {
        setSelectedFacility(null)
      }
    }
    loadFacilities()
  }, [selectedBuilding, selectedFloor, categoryFilter, searchQuery])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--ink)] tracking-tight flex items-center gap-2.5">
            <Compass className="w-7 h-7 text-[var(--ink)]" />
            Campus Explorer
          </h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Navigate buildings, explore floor layouts, and inspect available university spaces.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {buildings.map((b) => {
          const isSelected = selectedBuilding?.id === b.id
          return (
            <div
              key={b.id}
              onClick={() => setSelectedBuilding(b)}
              className={`p-4 rounded-sm border cursor-pointer transition flex items-center gap-3 ${
                isSelected
                  ? 'border-black bg-black text-white'
                  : 'border-[var(--line)] bg-white text-[var(--ink)] hover:border-[var(--line-strong)]'
              }`}
            >
              <div className={`w-9 h-9 rounded-sm flex items-center justify-center shrink-0 ${
                isSelected ? 'bg-white text-black' : 'bg-[var(--surface-2)] border border-[var(--line)]'
              }`}>
                <Building2 className="w-5 h-5" />
              </div>
              <div className="overflow-hidden">
                <span className="text-xs font-mono font-bold text-[var(--ink)] uppercase tracking-widest">{b.code}</span>
                <h3 className="font-bold text-sm truncate">{b.name}</h3>
                <p className="text-xs text-[var(--muted)] truncate flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-[var(--faint)] shrink-0" />
                  {b.location_description}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="rounded-sm border border-[var(--line)] bg-white p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          <span className="text-xs font-bold text-[var(--muted)] uppercase tracking-widest mr-1 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" />
            Levels:
          </span>
          {floors.map((floor) => {
            const isSelected = selectedFloor?.id === floor.id
            return (
              <button
                key={floor.id}
                onClick={() => setSelectedFloor(floor)}
                className={`px-3.5 py-1.5 rounded-sm text-xs font-bold whitespace-nowrap transition ${
                  isSelected
                    ? 'bg-black text-white'
                    : 'border-[var(--line)] text-[var(--muted)] hover:bg-[var(--surface-2)]'
                }`}
              >
                {floor.name.split('-')[0]}
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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-[var(--line)] rounded-sm bg-white focus:border-[var(--line-strong)]"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-[var(--faint)]" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border border-[var(--line)] rounded-sm text-xs py-2 px-3 font-medium text-[var(--ink)] bg-white focus:border-[var(--line-strong)] appearance-none"
            >
              <option value="all">All categories</option>
              <option value="auditorium">Auditorium</option>
              <option value="conference_room">Conference</option>
              <option value="laboratory">Laboratory</option>
              <option value="lecture_hall">Lecture Hall</option>
              <option value="multipurpose">Multipurpose</option>
            </select>
          </div>
        </div>
      </div>

      {selectedFloor && (
        <FloorPlanViewer
          floor={selectedFloor}
          facilities={facilities}
          selectedFacility={selectedFacility}
          onSelectFacility={setSelectedFacility}
        />
      )}
    </div>
  )
}
