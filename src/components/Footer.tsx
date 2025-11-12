import Image from "next/image";
import Link from "next/link";
import { navigationLinks } from "@/config/navigation";

const Footer = () => {
  return (
    <footer className="footer footer-center bg-base-200 text-base-content p-4 gap-2 text-sm">
      <nav className="flex flex-wrap gap-4 justify-self-start">
        {navigationLinks.map((link) => (
          <Link key={link.href} href={link.href} className="link link-hover">
            {link.label}
          </Link>
        ))}
        
        <div className="divider divider-horizontal mx-2 h-6"></div>
        
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 bg-gradient-to-r from-primary to-secondary p-1 rounded">
            <Link href="https://stat.gov.ua/uk" target="_blank" className="hover:opacity-80 transition-opacity">
              <Image src="/logo-data-bank.png" alt="Держстат" width={60} height={20} />
            </Link>
            <Link href="https://dia.gov.ua/" target="_blank" className="hover:opacity-80 transition-opacity"> 
              <Image src="/logo-dia.png" alt="Дія" width={30} height={30} />
            </Link>
          </div>
        </div>
        
        <div className="divider divider-horizontal mx-2 h-6"></div>
        
        <Link href="/about" className="link link-hover">Про проект</Link>
      </nav>
      
      <aside className="mt-2 justify-self-end">
        <p className="text-xs">
          © {new Date().getFullYear()}
        </p>
      </aside>
    </footer>
  );
};

export default Footer;
