import Image from "next/image";

const Footer = () => {
  return (
    <div className="h-16 mt-10">
      <Image
        src="/logo.png"
        alt="Map"
        className="w-full h-full"
        width={100}
        height={30}
      />
    </div>
  );
};

export default Footer;
