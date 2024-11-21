import Map from "@/components/Map";
import { useQuery } from "@tanstack/react-query";
import { getPopulation } from "@/queries";
import { Spinner } from "@/components";
import MapFilter from "@/components/MapFilter";

const Landing = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["population"],
    queryFn: () => getPopulation(),
  });

  if (isLoading) return <Spinner />;

  return (
    <>
      <MapFilter />
      <Map data={data} />
    </>
  );
};

export default Landing;
