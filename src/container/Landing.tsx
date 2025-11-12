import Map from "@/components/Map";
import MapFilter from "@/components/MapFilter";
import StatePopulationPanel from "@/components/StatePopulationPanel";

const Landing = () => {
  return (
    <>
      <Map />
      <MapFilter />
      <StatePopulationPanel />
    </>
  );
};

export default Landing;
