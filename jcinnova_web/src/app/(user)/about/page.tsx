"use client";
import { motion } from "framer-motion";
import Image from "next/image";
import { FaFacebook, FaInstagram, FaTwitter, FaWhatsapp } from "react-icons/fa";
import "./user_about.css";
import Link from "next/link";
import AboutServices from "@/app/(user)/about/_components/about_modules";
import LocationMap from "@/app/(user)/about/_components/about_location";
import { section2About, section2RightSide } from "./_components/about_data";

const About = () => {
  return (
    <>
      <section className="pg_about_innovajc" id="innovajc">
        <div className="pg_about_innovajc-inner">
          <div className="pg_about_innovajc-split">
            {/* LEFT: Logo */}
            <div className="pg_about_innovajc-left">
              <motion.div
                className="pg_about_innovajc-logoWrap"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 1 }}
                viewport={{ once: true }}
              >
                <Image
                  className="pg_about_innovajc-logo"
                  src="/images/LogoInnova.png"
                  alt="Logo Innova JC"
                  width={650}
                  height={500}
                  priority
                />
              </motion.div>
            </div>

            {/* RIGHT: Copy + Social */}
            <div className="pg_about_innovajc-right">
              <span className="pg_about_innovajc-pill">Sobre Nosotros</span>

              <h2 className="pg_about_innovajc-title">
                INNOVA JC{" "}
                <span className="pg_about_innovajc-grad">Soluciones</span>{" "}
                Integrales
              </h2>

              <p className="pg_about_innovajc-subtitle">
                Somos una empresa dedicada al desarrollo de soluciones
                tecnológicas para la gestión empresarial. Creamos software
                enfocado en ayudar a las empresas a organizar, automatizar y
                controlar sus procesos de forma eficiente.
              </p>
              <p className="pg_about_innovajc-subtitle">
                Nuestro sistema SECE integra en una sola plataforma áreas clave
                como{" "}
                <span className="pg_about_innovajc-subtitle-span">
                  contabilidad, inventario, compras, ventas, bancos y recursos
                  humanos
                </span>
                , brindando información centralizada y en tiempo real. Es una
                solución segura, escalable y adaptable, pensada para empresas
                que buscan crecer con orden y control. En InnovaJC combinamos
                tecnología, experiencia y acompañamiento constante para ofrecer
                herramientas confiables que impulsan la toma de decisiones y el
                desarrollo empresarial.
              </p>

              <div
                className="pg_about_innovajc_socialmedia"
                aria-label="Redes sociales"
              >
                <a href="https://facebook.com" aria-label="Facebook">
                  <FaFacebook />
                </a>
                <a href="https://instagram.com" aria-label="Instagram">
                  <FaInstagram />
                </a>
                <a href="https://twitter.com" aria-label="Twitter">
                  <FaTwitter />
                </a>
                <a href="https://wa.me/40701423" aria-label="WhatsApp">
                  <FaWhatsapp />
                </a>
              </div>

              <div className="pg_about_innovajc_button">
                <Link href="/contact">Contactanos</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ✅ MINI HEADER STICKY (NAV) */}
      <nav className="pg_about_stickyNav" aria-label="Navegación de la página">
        <div className="pg_about_stickyNav-inner">
          <a className="pg_about_stickyNav-link" href="#innovajc">
            Sobre InnovaJC
          </a>
          <a className="pg_about_stickyNav-link" href="#WhatWeDo">
            Qué ofrece SECE
          </a>
          <a className="pg_about_stickyNav-link" href="#services">
            Módulos SECE
          </a>
          <a className="pg_about_stickyNav-link" href="#location">
            Ubicación
          </a>

          <a className="pg_about_stickyNav-cta" href="/">
            Inicio
          </a>
        </div>
      </nav>

      <section className="pg_about_servicesFeature" id="WhatWeDo">
        <div className="pg_about_servicesFeature-inner">
          <h2 className="pg_about_servicesFeature-title">Qué ofrece SECE</h2>

          <div className="pg_about_servicesFeature-grid">
            <div className="pg_about_servicesFeature-left">
              {section2About.map((s) => (
                <article
                  key={s.title}
                  className="pg_about_servicesFeature-card"
                >
                  <div
                    className="pg_about_servicesFeature-icon"
                    aria-hidden="true"
                  >
                    <Image src={s.icon} alt={s.title} width={45} height={45} />
                  </div>
                  <div className="pg_about_servicesFeature-cardBody">
                    <h3 className="pg_about_servicesFeature-cardTitle">
                      {s.title}
                    </h3>
                    <p className="pg_about_servicesFeature-cardText">
                      {s.text}
                    </p>
                  </div>
                </article>
              ))}
            </div>

            <motion.div
              className="pg_about_innovajc-logoWrap"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 1 }}
              viewport={{ once: true }}
            >
              <aside
                className="pg_about_servicesFeature-right"
                aria-label="Nuestros servicios"
              >
                <h3 className="pg_about_servicesFeature-sideTitle">
                  Más servicios
                </h3>

                <ul className="pg_about_servicesFeature-list">
                  {section2RightSide.map((t) => (
                    <li key={t} className="pg_about_servicesFeature-li">
                      <span
                        className="pg_about_servicesFeature-check"
                        aria-hidden="true"
                      >
                        ✔
                      </span>
                      {t}
                    </li>
                  ))}
                </ul>

                <a className="pg_about_servicesFeature-cta" href="#services">
                  MÁS INFORMACIÓN
                </a>
              </aside>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="pg_about_services" id="services">
        <AboutServices />
      </section>

      <section className="pg_about_location" id="location">
        <LocationMap />
      </section>
    </>
  );
};

export default About;
