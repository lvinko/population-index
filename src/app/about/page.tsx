import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Про проект",
  description: "Інформація про проект аналізу населення України, його мету, джерела даних та принципи роботи.",
};

const AboutPage = () => {
  return (
    <div className="flex flex-col min-h-screen p-5 sm:p-8 bg-background text-foreground">
      <Header title="Про проект" />

      <main className="flex-1 max-w-3xl mx-auto">
        <div className="space-y-6 py-8">
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">Мета проекту</h2>
            <p className="text-foreground leading-relaxed">
              Цей проект створено з метою візуалізації демографічних даних України у зручному
              та інтуїтивно зрозумілому форматі. Ми прагнемо зробити статистичну інформацію
              доступною та легкою для аналізу широкому колу користувачів.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">Джерела даних</h2>
            <p className="text-foreground leading-relaxed">
              Ми використовуємо офіційні дані з державних джерел:
            </p>
            <ul className="list-disc list-inside text-foreground space-y-2 ml-4">
              <li>Державна служба статистики України (stat.gov.ua)</li>
              <li>Платформа Дія (diia.gov.ua)</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">Майбутній розвиток</h2>
            <p className="text-foreground leading-relaxed">
              У майбутньому проект буде розширено для відображення:
            </p>
            <ul className="list-disc list-inside text-foreground space-y-2 ml-4">
              <li>Економічних показників</li>
              <li>Соціальних індикаторів</li>
              <li>Додаткових демографічних даних</li>
              <li>Інших важливих аспектів розвитку країни</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">Наші принципи</h2>
            <ul className="list-disc list-inside text-foreground space-y-2 ml-4">
              <li>Інклюзивність та доступність для всіх користувачів</li>
              <li>Прозорість та достовірність даних</li>
              <li>Безпека та конфіденційність</li>
              <li>Постійне вдосконалення та оновлення</li>
            </ul>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Часті запитання</h2>

            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">Як часто оновлюються дані?</h3>
                <p className="text-foreground">
                  Дані оновлюються щоквартально відповідно до публікацій Державної служби статистики України.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">Чи можна використовувати дані з проекту?</h3>
                <p className="text-foreground">
                  Так, дані можна використовувати з обов&apos;язковим посиланням на першоджерело (Держстат України)
                  та наш проект.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">Як враховуються дані з тимчасово окупованих територій?</h3>
                <p className="text-foreground">
                  Дані з тимчасово окупованих територій позначаються окремо та супроводжуються відповідними
                  примітками щодо достовірності та джерел інформації.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">Як можна долучитися до розвитку проекту?</h3>
                <p className="text-foreground">
                  Ми відкриті до співпраці та пропозицій. Ви можете надіслати свої ідеї та пропозиції
                  через форму зворотного зв&apos;язку або приєднатися до розробки на GitHub.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">Які формати візуалізації доступні?</h3>
                <p className="text-foreground">
                  Наразі доступні інтерактивна карта та графіки динаміки населення. Ми постійно
                  працюємо над додаванням нових форматів візуалізації для кращого представлення даних.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AboutPage;
