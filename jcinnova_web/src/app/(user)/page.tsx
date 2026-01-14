"use client";
import Link from "next/link";
import React, { useEffect, useRef } from "react";
import Image from "next/image";

const Home = () => {
  const spansRef = useRef<(HTMLSpanElement | null)[]>([]);
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("show");
        }
      });
    });
    spansRef.current.forEach((span) => {
      if (span) observer.observe(span);
    });
    return () => observer.disconnect();
  }, []);
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
                <Link href="/about">Más de Nosotros</Link>
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

        <div className="pg_main-presentation-part2">
          <div className="pg_main-part2-sections">
            <div className="pg_main-part2-section1">
              <h3>Porqué Nosotros?</h3>
              <div className="pg_main-part2-section1-about">
                <Image
                  className="imagelogo"
                  src="/images/grafics.png"
                  alt="Logo"
                  width={100}
                  height={50}
                ></Image>
                <div className="pg_main-part2-section1-textbox">
                  <h3>Desarrollo a la Medida</h3>
                  <p>
                    Lorem ipsum dolor sit amet, consectetur adipisicing elit.
                    Autem, tempore sint aut error, praesentium voluptatem
                    doloribus iste dolorum consectetur alias laborum! Doloremque
                    doloribus minus ut quis sapiente totam distinctio maxime.
                  </p>
                </div>
              </div>
              <hr></hr>
              <div className="pg_main-part2-section1-about">
                <Image
                  className="imagelogo"
                  src="/images/grafics.png"
                  alt="Logo"
                  width={100}
                  height={50}
                ></Image>
                <div className="pg_main-part2-section1-textbox">
                  <h3>Dispositivos Móviles</h3>
                  <p>
                    Lorem ipsum dolor sit amet consectetur adipisicing elit. A
                    odit ratione quidem accusantium consequuntur illo ad atque
                    nobis, consectetur aliquid neque quisquam commodi libero
                    iure natus maxime culpa nihil itaque!
                  </p>
                </div>
              </div>
              <hr></hr>
              <div className="pg_main-part2-section1-about">
                <Image
                  className="imagelogo"
                  src="/images/grafics.png"
                  alt="Logo"
                  width={100}
                  height={50}
                ></Image>
                <div className="pg_main-part2-section1-textbox">
                  <h3>Sistema Administrativo Contable</h3>
                  <p>
                    Lorem ipsum dolor sit amet, consectetur adipisicing elit.
                    Temporibus est debitis beatae harum aperiam suscipit ratione
                    saepe ipsa incidunt. Aliquam velit quidem, iusto aspernatur
                    exercitationem quo eligendi facere placeat ad.
                  </p>
                </div>
              </div>
            </div>
            <div className="pg_main-part2-section2">
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

        <div className="pg_main-presentation-part3"></div>
        <div className="pg_main-presentation-part4"></div>
        {/* Va de otro color */}
        <div className="pg_main-presentation-part5"></div>
        <div className="pg_main-presentation-part6">
          <div className="pg-main-joinus">
            <h1>
              <span
                ref={(el) => {
                  spansRef.current[0] = el;
                }}
                className="h1-span-part6"
              >
                Quieres unirte?
              </span>
              <span
                ref={(el) => {
                  spansRef.current[1] = el;
                }}
                className="h1-span-part6"
              >
                Ponte en contacto.
              </span>
            </h1>
            <div className="pg_header-linkrouter">
              <Link href="/contact">Contactanos</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
