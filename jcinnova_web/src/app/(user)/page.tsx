import Link from "next/link";
import React from "react";
import Image from "next/image";

const Home = () => {
  return (
    <>
      <div className="pg_main">
        <div className="pg_main-presentation bg-[url('/images/mainpage/MainPagePresentation.png')] bg-no-repeat bg-right bg-fit">
          <div className="pg_main-presentation-sections">
            <div className="pg_main-presentation-section1">
              <h1>
                El sistema
                <span className="h1-span"> ADMINISTRATIVO </span>
                <span className="h1-span">CONTABLE </span>más amigable, sencillo
                y robusto para su negocio.
              </h1>
              <div className="pg_header-linkrouter">
                <Link href="/about">Más de Nossotros</Link>
              </div>
            </div>
            <div className="pg_main-presentation-section2">
              <Image
                className="imagelogo"
                src="/images/grafics.png"
                alt="Logo"
                width={100}
                height={50}
              ></Image>
            </div>
          </div>
        </div>
        <div className="Morecontent">
          <h1>HOLA MUNDO</h1>
          <h1>HOLA MUNDO</h1>
          <h1>HOLA MUNDO</h1>
          <h1>HOLA MUNDO</h1>
          <h1>HOLA MUNDO</h1>
          <h1>HOLA MUNDO</h1>
          <h1>HOLA MUNDO</h1>
          <h1>HOLA MUNDO</h1>
          <h1>HOLA MUNDO</h1>
          <h1>HOLA MUNDO</h1>
          <h1>HOLA MUNDO</h1>
          <h1>HOLA MUNDO</h1>
          <h1>HOLA MUNDO</h1>
          <h1>HOLA MUNDO</h1>
          <h1>HOLA MUNDO</h1>
          <h1>HOLA MUNDO</h1>
          <h1>HOLA MUNDO</h1>
          <h1>HOLA MUNDO</h1>
          <h1>HOLA MUNDO</h1>
          <h1>HOLA MUNDO</h1>
          <h1>HOLA MUNDO</h1>
          <h1>HOLA MUNDO</h1>
          <h1>HOLA MUNDO</h1>
          <h1>HOLA MUNDO</h1>
          <h1>HOLA MUNDO</h1>
          <h1>HOLA MUNDO</h1>
          <h1>HOLA MUNDO</h1>
          <h1>HOLA MUNDO</h1>
          <h1>HOLA MUNDO</h1>
          <h1>HOLA MUNDO</h1>
          <h1>HOLA MUNDO</h1>
        </div>
      </div>
    </>
  );
};

export default Home;
