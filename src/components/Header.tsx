import Image from "next/image";
import Link from "next/link";

const Header = ({
  title = "Аналіз населення України",
}) => {
  return <div className="w-full h-12 mb-2 flex items-center justify-between">
    <Link href="/">
      <Image src="/logo.png" alt="Map" width={80} height={30} />
    </Link>
    <h1 className="text-2xl font-bold">{title}</h1>
  </div>
};

export default Header;