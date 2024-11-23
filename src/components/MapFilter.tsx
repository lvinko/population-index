import { useMapFilter } from "@/context/MapFilterContext";

const MapFilter = () => {
  const { filters, setFilters } = useMapFilter();

  const fitlerLabelMap = {
    year: {
      label: 'Рік',
      options: Array.from({ length: 20 }, (_, i) => 2003 + i).map(year => ({
        value: year,
        label: year.toString()
      }))
    },
    type: {
      label: 'Тип',
      options: [
        { value: 'urban', label: 'Міста' },
        { value: 'rural', label: 'Сільська' },
        { value: 'total', label: 'Всі' }
      ]
    }
  }

  return (
    <div className="flex gap-4 items-center absolute bottom-32 sm:right-10 right-5 z-10 text-zinc-900 bg-white p-2 rounded-md">
      <label className="text-sm font-medium">{fitlerLabelMap.year.label}
        <select
          value={filters.year}
          onChange={(e) => setFilters(prev => ({ ...prev, year: parseInt(e.target.value) }))}
          className="px-4 py-2 border rounded-md ml-2"
        >
          {fitlerLabelMap.year.options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <div className="h-6 bg-black w-px" />

      <label className="text-sm font-medium">{fitlerLabelMap.type.label}
        <select
          value={filters.type}
          onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
          className="px-4 py-2 border rounded-md ml-2"
        >
          {fitlerLabelMap.type.options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

    </div>
  );
};

export default MapFilter;