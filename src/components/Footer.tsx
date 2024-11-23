import Image from "next/image";
import Link from "next/link";

const Footer = () => {
  return (
    <div className="h-12 mt-5 flex items-center justify-between px-4 gap-2">
      <Link href="/stats" className="mr-5 text-gray-600 hover:text-gray-900">Статистика</Link>

      <div className="w-0.5 h-full bg-gray-600 rounded-full"></div>

      <div className="flex flex-col items-center">
        <div className="flex items-center gap-2">
          <Link href="https://stat.gov.ua/uk" target="_blank">
            <Image src="/logo-data-bank.png" alt="Держстат" width={60} height={20} />
          </Link>
          <Link href="https://dia.gov.ua/" target="_blank">
            <Image src="/logo-dia.png" alt="Дія" width={40} height={40} />
          </Link>
        </div>
      </div>

      <div className="w-0.5 h-full bg-gray-600 rounded-full"></div>

      <Link href="/about" className="ml-5 text-gray-600 hover:text-gray-900">Про проект</Link>
    </div>
  );
};

export default Footer;
