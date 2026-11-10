import React, { useState, useEffect } from 'react'
import { Building2, Layers, Search, Filter, Compass, MapPin } from 'lucide-react'
import { dataStore } from '../../lib/dataStore'
import { FloorPlanViewer } from '../../features/campus/FloorPlanViewer'

export function CampusExplorerPage() {
  const [buildings, setBuildings] = useState([])
  const [floors, setFloors] = useState([])
  const [facilities, setFacilities] = useState([])

  const [selectedBuilding, setSelectedBuilding] = useState(null)
  const [selectedFloor, setSelectedFloor] = useState(null)
  const [selectedFacility, setSelectedFacility] = useState(null)

  const [categoryFilter, setCategoryFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Initial load
  useEffect(() => {
    async function loadData() {
      const bList = await dataStore.getBuildings()
      setBuildings(bList)
      if (bList.length > 0) {
        setSelectedBuilding(bList[0])
      }
    }
    loadData()
  }, [])

  // When building changes, load its floors
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

  // When floor or filters change, load facilities
  useEffect(() => {
    async function loadFacilities() {
      if (!selectedBuilding) return
      const facList = await dataStore.getFacilities({
        buildingId: selectedBuilding.id,
        floorId: selectedFloor?.id,
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
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Compass className="w-7 h-7 text-sky-600" />
            Interactive Campus Explorer
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Navigate through buildings, explore floor layouts, and inspect available university spaces.
          </p>
        </div>
      </div>

      {/* Building Selector Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {buildings.map((b) => {
          const isSelected = selectedBuilding?.id === b.id
          return (
            <div
              key={b.id}
              onClick={() => setSelectedBuilding(b)}
              className={`p-4 rounded-2xl border cursor-pointer transition flex items-center gap-4 ${
                isSelected
                  ? 'border-sky-500 bg-white ring-2 ring-sky-500/20 shadow-md'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                  isSelected ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                <Building2 className="w-6 h-6" />
              </div>
              <div className="overflow-hidden">
                <span className="text-xs font-mono font-bold text-sky-600">{b.code}</span>
                <h3 className="font-bold text-slate-900 text-sm truncate">{b.name}</h3>
                <p className="text-xs text-slate-500 truncate flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                  {b.location_description}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Floor Tab Selector & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Floor Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" />
            Levels:
          </span>
          {floors.map((floor) => {
            const isSelected = selectedFloor?.id === floor.id
            return (
              <button
                key={floor.id}
                onClick={() => setSelectedFloor(floor)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {floor.name.split('-')[0]}
              </button>
            )
          })}
        </div>

        {/* Category & Search filter */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 sm:w-48">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search room, code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg text-xs py-1.5 px-2.5 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              <option value="all">All Categories</option>
              <option value="auditorium">Auditorium</option>
              <option value="conference_room">Conference</option>
              <option value="laboratory">Laboratory</option>
              <option value="lecture_hall">Lecture Hall</option>
              <option value="multipurpose">Multipurpose</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Floor Plan View Component */}
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
