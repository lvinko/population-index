import { Metadata } from 'next';
import { siteConfig } from '@/config/metadata';

export const metadata: Metadata = {
  title: "Про проект",
  description: "Детальна інформація про проект аналізу населення України: мета проекту, джерела даних (Держстат України, Дія), принципи роботи, майбутній розвиток та часто задавані питання про демографічну статистику.",
  keywords: [
    "про проект",
    "джерела даних",
    "Держстат України",
    "мета проекту",
    "демографічна статистика",
    "статистика України",
    "FAQ",
    "часто задавані питання",
  ],
  openGraph: {
    title: "Про проект | Population Index",
    description: "Детальна інформація про проект аналізу населення України, джерела даних та принципи роботи",
    images: [
      {
        url: siteConfig.images.logo.url,
        width: siteConfig.images.logo.width,
        height: siteConfig.images.logo.height,
        alt: "Population Index - Про проект аналізу населення України",
        type: siteConfig.images.logo.type,
      },
    ],
  },
  twitter: {
    card: "summary",
    images: [
      {
        url: siteConfig.images.logo.url,
        alt: "Population Index - Про проект аналізу населення України",
      },
    ],
  },
};

const AboutPage = () => {
  return (
    <div className="flex flex-col p-5 sm:p-8 bg-base-100 text-base-content">
      <main className="flex-1 max-w-3xl mx-auto">
        <div className="space-y-6 py-8">
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-base-content">Мета проекту</h2>
            <p className="text-base-content leading-relaxed">
              Цей проект створено з метою візуалізації демографічних даних України у зручному
              та інтуїтивно зрозумілому форматі. Ми прагнемо зробити статистичну інформацію
              доступною та легкою для аналізу широкому колу користувачів.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-base-content">Джерела даних</h2>
            <p className="text-base-content leading-relaxed">
              Ми використовуємо офіційні дані з державних джерел:
            </p>
            <ul className="list-disc list-inside text-base-content space-y-2 ml-4">
              <li>Державна служба статистики України (stat.gov.ua)</li>
              <li>Платформа Дія (diia.gov.ua)</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-base-content">Майбутній розвиток</h2>
            <p className="text-base-content leading-relaxed">
              У майбутньому проект буде розширено для відображення:
            </p>
            <ul className="list-disc list-inside text-base-content space-y-2 ml-4">
              <li>Економічних показників</li>
              <li>Соціальних індикаторів</li>
              <li>Додаткових демографічних даних</li>
              <li>Інших важливих аспектів розвитку країни</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-base-content">Наші принципи</h2>
            <ul className="list-disc list-inside text-base-content space-y-2 ml-4">
              <li>Інклюзивність та доступність для всіх користувачів</li>
              <li>Прозорість та достовірність даних</li>
              <li>Безпека та конфіденційність</li>
              <li>Постійне вдосконалення та оновлення</li>
            </ul>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-base-content">Часті запитання</h2>

            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-base-content">Як часто оновлюються дані?</h3>
                <p className="text-base-content">
                  Дані оновлюються щоквартально відповідно до публікацій Державної служби статистики України.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-base-content">Чи можна використовувати дані з проекту?</h3>
                <p className="text-base-content">
                  Так, дані можна використовувати з обов&apos;язковим посиланням на першоджерело (Держстат України)
                  та наш проект.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-base-content">Як враховуються дані з тимчасово окупованих територій?</h3>
                <p className="text-base-content">
                  Дані з тимчасово окупованих територій позначаються окремо та супроводжуються відповідними
                  примітками щодо достовірності та джерел інформації.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-base-content">Як можна долучитися до розвитку проекту?</h3>
                <p className="text-base-content">
                  Ми відкриті до співпраці та пропозицій. Ви можете надіслати свої ідеї та пропозиції
                  через форму зворотного зв&apos;язку або приєднатися до розробки на GitHub.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-base-content">Які формати візуалізації доступні?</h3>
                <p className="text-base-content">
                  Наразі доступні інтерактивна карта та графіки динаміки населення. Ми постійно
                  працюємо над додаванням нових форматів візуалізації для кращого представлення даних.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default AboutPage;
