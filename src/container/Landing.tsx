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
      <Map data={data} />
      <MapFilter />
    </>
  );
};

export default Landing;
