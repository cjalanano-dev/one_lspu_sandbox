import { useState, useEffect } from 'react'
import {
  Building2,
  Layers,
  Search,
  Filter,
  Compass,
  MapPin,
} from 'lucide-react'

import { dataStore } from '../../lib/dataStore'
import { FloorPlanViewer } from '../../features/campus/FloorPlanViewer'
import type { Building, Floor, Facility } from '../../types'

export function CampusExplorerPage() {
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

      if (bList.length > 0) {
        setSelectedBuilding(bList[0])
      }
    }

    loadData()
  }, [])

  useEffect(() => {
    async function loadFloors() {
      if (!selectedBuilding) return

      const fList = await dataStore.getFloors(selectedBuilding.id)
      setFloors(fList)

      if (fList.length > 0) {
        setSelectedFloor(fList[0])
      } else {
        setSelectedFloor(null)
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
    <div className="relative min-h-screen space-y-7 overflow-hidden">

      {/* ATMOSPHERIC BACKGROUND */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background: `
            radial-gradient(ellipse at 8% 5%, rgba(98, 123, 108, 0.19), transparent 35%),
            radial-gradient(ellipse at 90% 38%, rgba(183, 194, 157, 0.09), transparent 35%),
            radial-gradient(ellipse at 50% 100%, rgba(20, 39, 45, 0.7), transparent 60%)
          `,
        }}
      />

      {/* HEADER */}
      <section className="relative overflow-hidden rounded-sm border border-[#627B6C]/30 bg-[#14272D]/70 p-6 sm:p-8">

        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage: `
              linear-gradient(rgba(149, 167, 144, 0.045) 1px, transparent 1px),
              linear-gradient(90deg, rgba(149, 167, 144, 0.045) 1px, transparent 1px)
            `,
            backgroundSize: '35px 35px',
          }}
        />

        <div
          className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full blur-3xl"
          style={{
            background: 'rgba(98, 123, 108, 0.22)',
          }}
        />

        <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">

          <div className="max-w-2xl">

            <div className="mb-4 inline-flex items-center gap-2 rounded-sm border border-[#95A790]/30 bg-[#08151C]/60 px-3 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#95A790] shadow-[0_0_8px_rgba(149,167,144,0.8)]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#B7C29D]">
                ONE LSPU / Campus Directory
              </span>
            </div>

            <h1 className="flex items-center gap-3 text-3xl font-extrabold tracking-tight text-[#F3F5F0] sm:text-4xl">
              <Compass className="h-8 w-8 shrink-0 text-[#95A790]" />
              Campus Explorer
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-7 text-[#B7C0B8] sm:text-base">
              Find your way around campus. Explore buildings, browse floor
              layouts, and discover the facilities available in each space.
            </p>

          </div>

          {/* DECORATIVE ACCENT DETAILS */}
          <div className="flex items-center gap-4 rounded-sm border border-[#627B6C]/25 bg-[#08151C]/50 px-4 py-3">

            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#95A790]" />
              <span className="text-[10px] font-medium uppercase tracking-wider text-[#B7C29D]">
                Explore
              </span>
            </div>

            <span className="h-4 w-px bg-[#627B6C]/40" />

            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#C6A66B]" />
              <span className="text-[10px] font-medium uppercase tracking-wider text-[#D6C39B]">
                Discover
              </span>
            </div>

            <span className="h-4 w-px bg-[#627B6C]/40" />

            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#B97878]" />
              <span className="text-[10px] font-medium uppercase tracking-wider text-[#D5A3A0]">
                Navigate
              </span>
            </div>

          </div>
        </div>
      </section>

      {/* BUILDING SELECTION */}
      <section className="space-y-3">

        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#95A790]">
              Step 01 / Select location
            </p>
            <h2 className="mt-1 text-lg font-bold text-[#F0F3ED]">
              Explore campus buildings
            </h2>
          </div>

          <p className="text-xs text-[#87958D]">
            {buildings.length} buildings listed
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">

          {buildings.map((b, index) => {
            const isSelected = selectedBuilding?.id === b.id

            return (
              <button
                key={b.id}
                type="button"
                onClick={() => setSelectedBuilding(b)}
                className={`group relative overflow-hidden rounded-sm border p-4 text-left transition-all duration-300 ${
                  isSelected
                    ? 'border-[#95A790]/70 bg-[#1C3738] shadow-[0_0_24px_rgba(98,123,108,0.13)]'
                    : 'border-[#627B6C]/25 bg-[#14272D]/65 hover:border-[#95A790]/50 hover:bg-[#1A3033]'
                }`}
              >

                {/* SELECTED CARD GLOW */}
                {isSelected && (
                  <div
                    className="pointer-events-none absolute -right-12 -top-16 h-36 w-36 rounded-full blur-3xl"
                    style={{
                      background: 'rgba(149, 167, 144, 0.19)',
                    }}
                  />
                )}

                <div className="relative flex items-center gap-3">

                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-sm border transition-colors ${
                      isSelected
                        ? 'border-[#95A790]/50 bg-[#95A790]/15 text-[#B7C29D]'
                        : 'border-[#627B6C]/30 bg-[#08151C]/60 text-[#95A790] group-hover:border-[#95A790]/50'
                    }`}
                  >
                    <Building2 className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">

                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#B7C29D]">
                        {b.code}
                      </span>

                      {isSelected && (
                        <span className="rounded-sm bg-[#95A790]/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#B7C29D]">
                          Selected
                        </span>
                      )}
                    </div>

                    <h3 className="mt-1 truncate text-sm font-bold text-[#F0F3ED]">
                      {b.name}
                    </h3>

                    <p className="mt-1 flex items-center gap-1 truncate text-xs text-[#9BA99F]">
                      <MapPin className="h-3 w-3 shrink-0 text-[#95A790]" />
                      {b.location_description}
                    </p>

                  </div>

                  <div className="text-[#95A790] opacity-60 transition-all group-hover:translate-x-1 group-hover:opacity-100">
                    →
                  </div>

                </div>

                {/* SMALL DECORATIVE ACCENT */}
                <div
                  className={`absolute bottom-0 left-0 h-[2px] transition-all duration-300 ${
                    isSelected
                      ? 'w-full bg-[#95A790]'
                      : index % 3 === 0
                        ? 'w-0 bg-[#95A790] group-hover:w-full'
                        : index % 3 === 1
                          ? 'w-0 bg-[#C6A66B] group-hover:w-full'
                          : 'w-0 bg-[#B97878] group-hover:w-full'
                  }`}
                />

              </button>
            )
          })}

        </div>
      </section>

      {/* FLOOR AND FILTER TOOLBAR */}
      <section className="relative overflow-hidden rounded-sm border border-[#627B6C]/30 bg-[#14272D]/75">

        <div
          className="pointer-events-none absolute right-0 top-0 h-32 w-64 opacity-30 blur-3xl"
          style={{
            background: 'radial-gradient(ellipse, #627B6C, transparent 70%)',
          }}
        />

        <div className="relative flex flex-col gap-5 p-4 sm:p-5">

          {/* FLOOR SELECTOR */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

            <div className="flex items-center gap-3">

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-[#627B6C]/40 bg-[#08151C]/70 text-[#B7C29D]">
                <Layers className="h-4 w-4" />
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#95A790]">
                  Step 02 / Floor selection
                </p>
                <h3 className="text-sm font-bold text-[#F0F3ED]">
                  Choose a floor level
                </h3>
              </div>

            </div>

            <div className="flex max-w-full items-center gap-2 overflow-x-auto pb-1">

              {floors.map((floor) => {
                const isSelected = selectedFloor?.id === floor.id

                return (
                  <button
                    key={floor.id}
                    type="button"
                    onClick={() => setSelectedFloor(floor)}
                    className={`shrink-0 rounded-sm border px-4 py-2 text-xs font-bold transition-all ${
                      isSelected
                        ? 'border-[#95A790] bg-[#95A790] text-[#08151C] shadow-[0_0_14px_rgba(149,167,144,0.16)]'
                        : 'border-[#627B6C]/35 bg-[#08151C]/50 text-[#B7C0B8] hover:border-[#95A790]/60 hover:text-[#F0F3ED]'
                    }`}
                  >
                    {floor.name.split('-')[0]}
                  </button>
                )
              })}

              {floors.length === 0 && (
                <span className="text-xs text-[#87958D]">
                  No floors available for this building.
                </span>
              )}

            </div>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-[#627B6C]/40 to-transparent" />

          {/* SEARCH AND CATEGORY FILTER */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#95A790]">
                Step 03 / Find a facility
              </p>
              <h3 className="text-sm font-bold text-[#F0F3ED]">
                Search and filter spaces
              </h3>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">

              {/* SEARCH INPUT */}
              <div className="relative min-w-0 sm:w-64">

                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#95A790]" />

                <input
                  type="text"
                  placeholder="Search room, code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-sm border border-[#627B6C]/35 bg-[#08151C]/70 py-2.5 pl-10 pr-3 text-xs text-[#F0F3ED] outline-none transition placeholder:text-[#718078] focus:border-[#95A790] focus:ring-1 focus:ring-[#95A790]/30"
                />

              </div>

              {/* CATEGORY SELECT */}
              <div className="relative flex items-center gap-2">

                <Filter className="h-4 w-4 shrink-0 text-[#95A790]" />

                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full cursor-pointer appearance-none rounded-sm border border-[#627B6C]/35 bg-[#08151C]/70 px-3 py-2.5 pr-8 text-xs font-medium text-[#E7ECE5] outline-none transition focus:border-[#95A790] sm:w-48"
                >
                  <option value="all">All categories</option>
                  <option value="auditorium">Auditorium</option>
                  <option value="conference_room">Conference</option>
                  <option value="laboratory">Laboratory</option>
                  <option value="lecture_hall">Lecture Hall</option>
                  <option value="multipurpose">Multipurpose</option>
                </select>

                <span className="pointer-events-none absolute right-3 text-[10px] text-[#95A790]">
                  ▼
                </span>

              </div>

            </div>
          </div>

        </div>
      </section>

      {/* FLOOR PLAN SECTION */}
      <section className="space-y-3">

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#95A790]">
              Campus map / Facility layout
            </p>

            <h2 className="mt-1 text-lg font-bold text-[#F0F3ED]">
              {selectedFloor
                ? `${selectedBuilding?.name ?? 'Campus'} — ${selectedFloor.name}`
                : 'Floor plan'}
            </h2>
          </div>

          <div className="flex items-center gap-2 self-start rounded-sm border border-[#627B6C]/30 bg-[#14272D]/70 px-3 py-2 sm:self-auto">
            <span className="h-1.5 w-1.5 rounded-full bg-[#95A790]" />
            <span className="text-xs text-[#B7C0B8]">
              {facilities.length} {facilities.length === 1 ? 'facility' : 'facilities'} found
            </span>
          </div>

        </div>

        {selectedFloor ? (
          <div className="relative overflow-hidden rounded-sm border border-[#627B6C]/30 bg-[#14272D]/60 p-2 sm:p-4">

            <div
              className="pointer-events-none absolute inset-0 opacity-30"
              style={{
                backgroundImage: `
                  radial-gradient(circle at 10% 20%, rgba(98,123,108,0.15), transparent 35%),
                  radial-gradient(circle at 90% 80%, rgba(183,194,157,0.08), transparent 35%)
                `,
              }}
            />

            <div className="relative z-10">
              <FloorPlanViewer
                floor={selectedFloor}
                facilities={facilities}
                selectedFacility={selectedFacility}
                onSelectFacility={setSelectedFacility}
              />
            </div>

          </div>
        ) : (
          <div className="flex min-h-64 flex-col items-center justify-center rounded-sm border border-dashed border-[#627B6C]/40 bg-[#14272D]/50 px-5 text-center">

            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-sm border border-[#627B6C]/40 bg-[#08151C]/60 text-[#95A790]">
              <Building2 className="h-6 w-6" />
            </div>

            <h3 className="text-sm font-bold text-[#F0F3ED]">
              No floor selected
            </h3>

            <p className="mt-2 max-w-sm text-xs leading-6 text-[#9BA99F]">
              Select a campus building with available floors to view its layout
              and explore its facilities.
            </p>

          </div>
        )}

      </section>

      {/* BOTTOM ACCENT */}
      <div className="flex items-center justify-center gap-3 pb-2 pt-2">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#627B6C]/40" />
        <span className="text-[9px] font-medium uppercase tracking-[0.25em] text-[#718078]">
          ONE LSPU · Explore your campus
        </span>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#627B6C]/40" />
      </div>

    </div>
  )
}