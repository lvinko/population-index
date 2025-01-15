const getPopulationByYear = async (filters: { year?: number }) => {
  const { year } = filters;
  const queryParams = new URLSearchParams();
  if (year) {
    queryParams.set("year", year.toString());
  }

  const response = await fetch(`/api/populationByYear?${queryParams.toString()}`);
  return response.json();
};

const getPopulation = async () => {
  const response = await fetch(`/api/population`);
  return response.json();
};

export { getPopulationByYear, getPopulation };
