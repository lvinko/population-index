const getPopulation = async () => {
  const response = await fetch("/api/population");
  return response.json();
};

export { getPopulation };
