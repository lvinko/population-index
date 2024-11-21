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
      label: 'Тип населенного пункту',
      options: [
        { value: 'urban', label: 'Міста' },
        { value: 'rural', label: 'Селища' },
        { value: 'total', label: 'Всі населені пункти' }
      ]
    }
  }

  return (
    <div className="flex gap-4 items-center absolute bottom-36 right-8 z-10 text-zinc-900 bg-white p-3 rounded-md">
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
      <div className="h-px bg-black w-px h-4" />

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