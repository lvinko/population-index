import Image from "next/image";
import Link from "next/link";
import NotificationButton from "./NotificationButton";

const Header = ({
  title = "Аналіз населення України",
  children
}: {
  title?: string;
  children?: React.ReactNode;
}) => {
  return <div className="w-full h-12 mb-2 flex items-center justify-between">
    <Link href="/">
      <Image src="/logo.png" alt="Map" width={80} height={30} />
    </Link>
    {children}
    <h1 className="text-2xl font-bold">
      {title}
      <NotificationButton />
    </h1>
  </div>
};

export default Header;