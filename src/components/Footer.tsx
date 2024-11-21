import Image from "next/image";

const Footer = () => {
  return (
    <div>
      <div className="h-16 mt-10">
        <Image
          src="/logo.png"
          alt="Map"
          className="w-full h-full"
          width={1000}
          height={1000}
        />
      </div>
    </div>
  );
};

export default Footer;
