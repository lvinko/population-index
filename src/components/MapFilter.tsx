import { useMapFilter } from "@/context/MapFilterContext";

const MapFilter = () => {
  const { filters, setFilters } = useMapFilter();

  return (
    <div className="flex gap-4 items-center">
      <select
        value={filters.year}
        onChange={(e) => setFilters(prev => ({...prev, year: parseInt(e.target.value)}))}
        className="px-4 py-2 border rounded-md"
      >
        {Array.from({length: 20}, (_, i) => 2003 + i).map(year => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>

      <select 
        value={filters.type}
        onChange={(e) => setFilters(prev => ({...prev, type: e.target.value}))}
        className="px-4 py-2 border rounded-md"
      >
        <option value="">Select type</option>
        <option value="urban">Urban</option>
        <option value="rural">Rural</option>
        <option value="total">Total</option>
      </select>
    </div>
  );
};

export default MapFilter;