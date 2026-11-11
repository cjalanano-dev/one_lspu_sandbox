import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Building2, Search, Users, Cpu, ArrowRight } from 'lucide-react'
import { dataStore } from '../../lib/dataStore'
import { facilityImageUrl } from '../../lib/facilityImages'
import type { Facility, Building } from '../../types'

export function FacilitiesDirectoryPage() {
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [buildingsMap, setBuildingsMap] = useState<Record<string, Building>>({})
  const [search, setSearch] = useState<string>('')
  const [category, setCategory] = useState<string>('all')

  useEffect(() => {
    async function loadData() {
      const facs = await dataStore.getFacilities()
      setFacilities(facs)
      const blds = await dataStore.getBuildings()
      const bMap: Record<string, Building> = {}
      blds.forEach((b) => {
        bMap[b.id] = b
      })
      setBuildingsMap(bMap)
    }
    loadData()
  }, [])

  const filtered = facilities.filter((f) => {
    if (category !== 'all' && f.category !== category) return false
    if (search) {
      const term = search.toLowerCase()
      return (
        f.name.toLowerCase().includes(term) ||
        f.facility_code.toLowerCase().includes(term) ||
        f.description?.toLowerCase().includes(term)
      )
    }
    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--ink)] tracking-tight flex items-center gap-2.5">
            <Building2 className="w-7 h-7 text-[var(--ink)]" />
            Campus Facilities Directory
          </h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Browse all university conference rooms, auditoriums, laboratories, and athletic venues.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-56">
            <Search className="w-4 h-4 text-[var(--faint)] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search facility name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-[var(--line)] rounded-sm bg-[var(--paper)] focus:border-[var(--line-strong)]"
            />
          </div>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border border-[var(--line)] rounded-sm text-xs py-2 px-3 font-medium text-[var(--ink)] bg-[var(--paper)] focus:border-[var(--line-strong)] appearance-none"
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((fac) => {
          const building = buildingsMap[fac.building_id]
          return (
            <div
              key={fac.id}
              className="border border-[var(--line)] rounded-sm bg-[var(--paper)] overflow-hidden flex flex-col justify-between transition hover:border-[var(--line-strong)]"
            >
              <div>
                <div className="relative aspect-[16/9] bg-[var(--surface-2)] overflow-hidden border-b border-[var(--line)]">
                  <img
                    src={facilityImageUrl(fac)}
                    alt={fac.name}
                    className="w-full h-full object-cover grayscale"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = facilityImageUrl({
                        image_url: null,
                        category: 'multipurpose',
                      })
                    }}
                  />
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-sm text-xs font-mono font-bold uppercase bg-[var(--ink)] text-[var(--paper)] border border-[var(--ink)]">
                    {fac.facility_code}
                  </span>
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded-sm text-xs font-bold uppercase bg-[var(--paper)] border border-[var(--ink)] text-[var(--ink)]">
                    {fac.category.replace('_', ' ')}
                  </span>
                </div>

                <div className="p-5 space-y-3">
                  <div className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider">
                    {building?.name || 'Campus Building'}
                  </div>
                  <h3 className="font-bold text-[var(--ink)] text-sm leading-snug">{fac.name}</h3>
                  <p className="text-xs text-[var(--muted)] line-clamp-2 leading-relaxed">
                    {fac.description}
                  </p>

                  <div className="flex items-center gap-4 pt-2 text-[var(--muted)] text-xs">
                    <span className="flex items-center gap-1 font-medium text-[var(--ink)]">
                      <Users className="w-3 h-3" />
                      {fac.capacity} seats
                    </span>
                    <span className="flex items-center gap-1">
                      <Cpu className="w-3 h-3" />
                      {fac.equipment?.length || 0} equipment items
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-5 pt-0">
                <Link
                  to={`/facilities/${fac.id}`}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-sm bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-[var(--accent-ink)] font-semibold text-sm  transition"
                >
                  View Details & Book
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
