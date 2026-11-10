import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Building2, Search, Users, Cpu, ArrowRight } from 'lucide-react'
import { dataStore } from '../../lib/dataStore'
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
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Building2 className="w-7 h-7 text-sky-600" />
            Campus Facilities Directory
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse all university conference rooms, auditoriums, laboratories, and athletic venues.
          </p>
        </div>

        {/* Search & Filter */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-56">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search facility name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl text-xs py-1.5 px-3 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-500"
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

      {/* Facilities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((fac) => {
          const building = buildingsMap[fac.building_id]
          return (
            <div
              key={fac.id}
              className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition"
            >
              <div>
                <div className="relative aspect-[16/9] bg-slate-100 overflow-hidden">
                  <img
                    src={fac.image_url || ''}
                    alt={fac.name}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-900/80 backdrop-blur text-white">
                    {fac.facility_code}
                  </span>
                  <span className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/90 backdrop-blur text-slate-800 capitalize">
                    {fac.category.replace('_', ' ')}
                  </span>
                </div>

                <div className="p-5 space-y-3">
                  <div className="text-xs text-sky-600 font-semibold">
                    {building?.name || 'Campus Building'}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 leading-snug">{fac.name}</h3>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {fac.description}
                  </p>

                  <div className="flex items-center gap-4 pt-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1 font-semibold text-slate-700">
                      <Users className="w-3.5 h-3.5 text-sky-600" />
                      {fac.capacity} seats
                    </span>
                    <span className="flex items-center gap-1">
                      <Cpu className="w-3.5 h-3.5 text-indigo-600" />
                      {fac.equipment?.length || 0} equipment items
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-5 pt-0">
                <Link
                  to={`/facilities/${fac.id}`}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition"
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
