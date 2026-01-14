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
        <div className="pg_main-presentation-part2"></div>
        <div className="pg_main-presentation-part3"></div>
        <div className="pg_main-presentation-part4"></div>
        <div className="pg_main-presentation-part5">
          <h1>a</h1>
          <h1>a</h1>
          <h1>a</h1>
          <h1>a</h1>
          <h1>a</h1>
          <h1>a</h1>
          <h1>a</h1>
          <h1>a</h1>
          <h1>a</h1>
          <h1>a</h1>
          <h1>a</h1>
          <h1>a</h1>
        </div>
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
