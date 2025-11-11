import PredictionForm from './components/PredictionForm';

export default function PredictPage() {
  return (
    <main className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-semibold mb-6">Population Prediction (Ukraine)</h1>
      <p className="mb-6 text-gray-600">
        Explore how demographic trends and external factors could influence Ukraine&apos;s future population.
        Adjust the inputs below to simulate different scenarios.
      </p>
      <PredictionForm />
    </main>
  );
}

