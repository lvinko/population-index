import Map from "@/components/Map";
import { useQuery } from "@tanstack/react-query";
import { getPopulationByYear } from "@/queries";
import MapFilter from "@/components/MapFilter";
import { useMapFilter } from "@/context/MapFilterContext";

const Landing = () => {
  const { filters } = useMapFilter();
  const { data: populationData, isLoading } = useQuery({
    queryKey: ["population", filters],
    queryFn: () => getPopulationByYear(filters),
    // 24 hours
    staleTime: 1000 * 60 * 60 * 24,
  });

  return (
    <>
      <Map data={populationData?.data} isLoading={isLoading} />
      <MapFilter />
    </>
  );
};

export default Landing;
