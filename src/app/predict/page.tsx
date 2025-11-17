import PredictionForm from './components/PredictionForm';

export default function PredictPage() {
  return (
    <div className="flex-1 flex flex-col bg-base-100 text-base-content overflow-hidden">
      <main className="flex-1 mx-auto w-full py-8 px-4 sm:px-6">
        <div className="space-y-6">
          <div tabIndex={0} className="collapse bg-base-100 border-base-300 border">
            <div className="collapse-title font-semibold">Як працює прогноз?</div>
            <div className="collapse-content text-sm">
              Прогноз розраховується на основі демографічних даних України та зовнішніх факторів, таких як війна, економічна ситуація, смертність, народжуваність, міграція тощо.
              Налаштуйте параметри нижче, щоб симулювати різні сценарії.
            </div>
          </div>
          <PredictionForm />
        </div>
      </main>
    </div>
  );
}

