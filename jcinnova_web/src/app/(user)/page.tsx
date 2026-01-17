"use client";
import Link from "next/link"; /*Rout pages whiout loading it*/
import React, { useState, useEffect, useRef } from "react";
import Image from "next/image"; /*Library allow show images*/
import { motion } from "framer-motion"; /*Library helps animate entry of text*/

const whyUsItems = [
  {
    title: "Uso fácil y rápido aprendizaje",
    text: "SECE cuenta con una interfaz moderna e intuitiva que permite a cualquier usuario familiarizarse con el sistema sin capacitación avanzada, agilizando el inicio de operaciones.",
    img: "/images/mainpage/LogoSece.png",
  },
  {
    title: "Automatización y control inteligente",
    text: "El software reduce tareas manuales en contabilidad, inventarios, ventas y planillas. Con procesos automáticos, tus equipos trabajan con mayor precisión, evitando errores y manteniendo la información organizada en tiempo real.",
    img: "/images/mainpage/LogoSece.png",
  },
  {
    title: "Acceso desde cualquier lugar de forma segura",
    text: "Disponible en la nube, SECE permite trabajar desde oficina, casa o dispositivos móviles. Los datos se sincronizan automáticamente y permanecen protegidos con controles de seguridad y respaldo.",
    img: "/images/mainpage/LogoSece.png",
  },
];

const Home = () => {
  return (
    <>
      <div className="pg_main">
        <div className="pg_main-presentation bg-[url('/images/mainpage/MainPagePresentation.png')] bg-no-repeat bg-right bg-fit">
          <div className="pg_main-presentation-sections">
            {/*============= Section 1 (Presentation) =============*/}
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
                src="/images/mainpage/LogoSece.png"
                alt="Logo"
                width={50}
                height={50}
              ></Image>
            </div>
          </div>
        </div>

        {/*============= Section 2 (Presentation) =============*/}
        <div className="pg_main-presentation-part2">
          <div className="pg_main-part2-sections">
            <div className="pg_main-part2-section1">
              <h3>Porqué Nosotros?</h3>

              {whyUsItems.map((item, index) => (
                <React.Fragment key={index}>
                  <div className="pg_main-part2-section1-about">
                    <Image
                      className="imagelogo"
                      src={item.img}
                      alt={item.title}
                      width={140}
                      height={20}
                    />

                    <div className="pg_main-part2-section1-textbox">
                      <h5>{item.title}</h5>
                      <p>{item.text}</p>
                    </div>
                  </div>

                  {index !== whyUsItems.length - 1 && <hr />}
                </React.Fragment>
              ))}
            </div>
            <motion.div
              className="pg_main-part2-section2"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 1 }}
              viewport={{ once: true }}
            >
              <Image
                className="imagelogo"
                src="/images/mainpage/LogoSece.png"
                alt="Logo"
                width={500}
                height={500}
              ></Image>
            </motion.div>
          </div>
        </div>
        {/*============= Section 3 (Presentation) =============*/}
        <div className="pg_main-presentation-part3"></div>
        {/*============= Section 4 (Presentation) =============*/}
        <div className="pg_main-presentation-part4"></div>
        {/*============= Section 5 (Presentation) =============*/}
        {/* Va de otro color */}
        <div className="pg_main-presentation-part5"></div>

        {/*============= Section 6 (Contact Us) =============*/}
        <div className="pg_main-presentation-part6">
          <div className="pg-main-joinus">
            <h1>
              <motion.span
                className="h1-span-part6"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: "easeOut" }}
                viewport={{ once: true }}
              >
                Quieres unirte?
              </motion.span>
              <motion.span
                className="h1-span-part6"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: "easeOut" }}
                viewport={{ once: true }}
              >
                Ponte en contacto.
              </motion.span>
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
