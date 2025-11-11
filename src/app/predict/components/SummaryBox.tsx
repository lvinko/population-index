import { PredictionResult } from '@/lib/utils/types';

interface SummaryBoxProps {
  result: PredictionResult;
}

export default function SummaryBox({ result }: SummaryBoxProps) {
  return (
    <div className="p-4 bg-gray-100 rounded shadow space-y-2">
      <p>{result.message}</p>
      <p>
        <b>Predicted population:</b> {result.predictedPopulation.toLocaleString()}
      </p>
      <p>
        <b>Adjusted growth rate:</b> {(result.adjustedRate * 100).toFixed(2)}% per year
      </p>
      <p>
        <b>Carrying capacity:</b> {result.carryingCapacity.toLocaleString()}
      </p>
      <p>
        <b>Confidence range:</b>{' '}
        {result.lowerBound.toLocaleString()} – {result.upperBound.toLocaleString()}
      </p>
    </div>
  );
}

