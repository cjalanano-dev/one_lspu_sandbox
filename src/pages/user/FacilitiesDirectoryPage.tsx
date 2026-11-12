import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Building2, Search, Users, Cpu, ArrowRight } from 'lucide-react'
import { dataStore } from '../../lib/dataStore'
import { facilityImageUrl } from '../../lib/facilityImages'
import { useAuth } from '../../features/auth/AuthContext'
import type { Facility, Building } from '../../types'

export function FacilitiesDirectoryPage() {
  const { isApprover, isAdmin } = useAuth()
  const isPureSignatory = isApprover && !isAdmin

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
      <div className="rounded-[var(--radius-lg)] bg-[var(--ink)] text-[var(--paper)] p-6 border border-[var(--ink-soft)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--accent-line)]">
            {isPureSignatory ? 'Signatory Venue Reference' : 'Campus Venue Catalog'}
          </span>
          <h1 className="text-2xl font-extrabold text-[var(--paper)] tracking-tight flex items-center gap-2.5 mt-0.5">
            <Building2 className="w-6 h-6 text-[var(--accent)]" />
            Campus Facilities Directory
          </h1>
          <p className="text-xs text-[var(--paper)]/70 mt-1">
            {isPureSignatory
              ? 'Reference room capacities, equipment specifications, and live schedules when evaluating event proposals.'
              : 'Browse university conference rooms, auditoriums, laboratories, and athletic venues.'}
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-56">
            <Search className="w-4 h-4 text-[var(--paper)]/40 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search facility name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-[var(--ink-soft)] rounded-[var(--radius)] bg-[var(--ink-dark)] text-[var(--paper)] placeholder:text-[var(--paper)]/40 focus:border-[var(--accent)]"
            />
          </div>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border border-[var(--ink-soft)] rounded-[var(--radius)] text-xs py-2 px-3 font-medium text-[var(--paper)] bg-[var(--ink-dark)] focus:border-[var(--accent)]"
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
              className="panel overflow-hidden flex flex-col justify-between transition hover:border-[var(--accent)]"
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
                  <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-xs text-xs font-mono font-bold uppercase bg-[var(--ink)] text-[var(--accent-line)] border border-[var(--accent)]/40">
                    {fac.facility_code}
                  </span>
                  <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-xs text-[11px] font-mono font-semibold uppercase bg-[var(--paper)]/95 border border-[var(--line)] text-[var(--ink)]">
                    {fac.category.replace('_', ' ')}
                  </span>
                </div>

                <div className="p-5 space-y-2.5">
                  <div className="text-[11px] font-mono font-semibold text-[var(--accent-text)] uppercase tracking-wider">
                    {building?.name || 'Campus Building'}
                  </div>
                  <h3 className="font-extrabold text-[var(--ink)] text-base leading-snug">{fac.name}</h3>
                  <p className="text-xs text-[var(--muted)] line-clamp-2 leading-relaxed">
                    {fac.description}
                  </p>

                  <div className="flex items-center gap-4 pt-2 border-t border-[var(--line)] text-[var(--muted)] text-xs">
                    <span className="flex items-center gap-1.5 font-semibold text-[var(--ink)]">
                      <Users className="w-3.5 h-3.5 text-[var(--accent)]" />
                      {fac.capacity} seats
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-[var(--muted)]" />
                      {fac.equipment?.length || 0} equipment items
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-5 pt-0">
                <Link
                  to={`/facilities/${fac.id}`}
                  className="w-full btn-primary gap-2"
                >
                  {isPureSignatory ? 'Inspect Venue Schedule' : 'View Details & Book'}
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
