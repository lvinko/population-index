import Image from "next/image";
import Link from "next/link";

const Footer = () => {
  return (
    <div className="h-13 mt-5 flex items-center justify-center p-4 gap-2 text-sm">
      <Link href="/" className="mr-5 text-foreground hover:text-primary">Головна</Link>
      <Link href="/stat" className="mr-5 text-foreground hover:text-primary">Статистика</Link>

      <div className="w-0.5 h-full bg-gray-600 rounded-full"></div>

      <div className="flex flex-col items-center">
        <div className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 p-1 rounded">
          <Link href="https://stat.gov.ua/uk" target="_blank">
            <Image src="/logo-data-bank.png" alt="Держстат" width={60} height={20} />
          </Link>
          <Link href="https://dia.gov.ua/" target="_blank"> 
            <Image src="/logo-dia.png" alt="Дія" width={30} height={30} />
          </Link>
        </div>

        <small className="text-xs text-foreground">
          Ресурси
        </small>
      </div>

      <div className="w-0.5 h-full bg-gray-600 rounded-full"></div>

      <Link href="/about" className="ml-5 text-foreground hover:text-primary">Про проект</Link>

      <small className="text-xs text-foreground">
        © {new Date().getFullYear()}
      </small>
    </div>
  );
};

export default Footer;
