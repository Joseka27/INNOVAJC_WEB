import Link from "next/link";
import React from "react";

const Home = () => {
  return (
    <>
      <div>Content Main Page</div>
      <div>Content Main Page</div>
      <div>Content Main Page</div>
      <div>Content Main Page</div>
      <Link href={"/downloads"}>Downloads</Link>;
      <Link href={"/customers"}>customers</Link>;
      <Link href={"/about"}>About</Link>;<Link href={"/contact"}>Contact</Link>;
    </>
  );
};

export default Home;
