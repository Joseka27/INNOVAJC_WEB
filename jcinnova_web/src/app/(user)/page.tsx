"use client";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import MainCarousel from "@/app/(user)/_components/landing_carousel";
import ServicesSection from "@/app/(user)/_components/landing_serviceModules";
import {
  problemItems,
  solutionItems,
  outcomes,
  seceSteps,
  seceStats,
} from "./_components/landing_data";

const Home = () => {
  return (
    <>
      <div className="pg_main">
        {/*============= Section 1 (Presentation) =============*/}
        <section className="pg_main-presentation">
          <div className="pg_main-presentation-sections">
            <div className="pg_main-presentation-section1">
              <h1>
                Sistema
                <span className="h1-span"> ADMINISTRATIVO </span>
                <span className="h1-span">CONTABLE </span>más amigable, sencillo
                y robusto para su negocio.
              </h1>
              <div className="section1-button">
                <Link href="/about">Más de Nosotros</Link>
              </div>
            </div>
            <div className="pg_main-presentation-section2">
              <motion.div
                initial={{ opacity: 0, x: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 1 }}
                viewport={{ once: true }}
              >
                <Image
                  className="presentation_section1"
                  src="/images/LogoInnova.png"
                  alt="Logo"
                  width={650}
                  height={500}
                ></Image>
              </motion.div>
            </div>
          </div>
        </section>
        {/*============= Section 2 (Why us) =============*/}
        <section className="pg_main-presentation-part2" id="solucion">
          <div className="pg_main-part2-inner">
            <div className="pg_main-part2-head">
              <span className="pg_main-part2-pill">¿Porqué Nosotros?</span>
              <h2 className="pg_main-part2-title">
                Mayor <span className="pg_main-part2-grad">control</span> de tu
                negocio.
              </h2>
              <p className="pg_main-part2-subtitle">
                La información dispersa en diferentes aplicaciones y sistemas
                sueltos generan perdidas de tiempo y toma decisiones tardias.
                Por esta razón SECE Software marca la diferencia.
              </p>
            </div>

            <div className="pg_main-part2-compare">
              <motion.div
                className="h1-span-part6"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: "easeOut" }}
                viewport={{ once: true }}
              >
                <div className="pg_main-part2-block pg_main-part2-problem">
                  <div className="pg_main-part2-blockTop">
                    <div className="pg_main-part2-badge pg_main-part2-badgeProblem">
                      Problemas
                    </div>
                    <h3>Lo que suele pasar sin un sistema centralizado</h3>
                  </div>

                  <ul className="pg_main-part2-list">
                    {problemItems.map((t) => (
                      <li key={t} className="pg_main-part2-li">
                        <span
                          className="pg_main-part2-dot pg_main-part2-dotProblem"
                          aria-hidden
                        />
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
              <motion.div
                className="h1-span-part6"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                viewport={{ once: true }}
              >
                <div className="pg_main-part2-block pg_main-part2-solution">
                  <div className="pg_main-part2-blockTop">
                    <div className="pg_main-part2-badge pg_main-part2-badgeSolution">
                      Solución SECE
                    </div>
                    <h3>SECE Sofware lo resuelve</h3>
                  </div>

                  <ul className="pg_main-part2-list">
                    {solutionItems.map((t) => (
                      <li key={t} className="pg_main-part2-li">
                        <span
                          className="pg_main-part2-dot pg_main-part2-dotSolution"
                          aria-hidden
                        />
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="pg_main-part2-miniCta">
                    <a className="pg_main-part2-btnPrimary" href="#servicios">
                      Ver módulos
                    </a>
                    <a className="pg_main-part2-btnGhost" href="/contact">
                      Ponte en contácto
                    </a>
                  </div>
                </div>
              </motion.div>
            </div>

            <div
              className="pg_main-part2-outcomes"
              aria-label="Resultados esperados"
            >
              {outcomes.map((o) => (
                <div key={o.label} className="pg_main-part2-outcome">
                  <div className="pg_main-part2-outcomeNum">
                    <Image
                      src={o.icon}
                      alt={o.label}
                      width={40}
                      height={40}
                    ></Image>
                  </div>
                  <div className="pg_main-part2-outcomeLabel">{o.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
        {/*============= Section 3 (Presentation) =============*/}
        <section className="pg_main-presentation-part3" id="ventajas">
          <div className="pg_main-part3-inner">
            <div className="pg_main-part3-split">
              <div className="pg_main-part3-left">
                <span className="pg_main-part3-pill">Potencia tu empresa</span>

                <h2 className="pg_main-part3-title">
                  Pensado para{" "}
                  <span className="pg_main-part3-grad">control</span>, reportes
                  e integraciones
                </h2>

                <p className="pg_main-part3-subtitle">
                  Lo que más valoran las empresas: información exportable,
                  reportería extensa y conexiones que facilitan cumplimiento y
                  gestión.
                </p>

                <div className="pg_main-part3-actions">
                  <a className="pg_main-part3-btnPrimary" href="#servicios">
                    Ver módulos
                  </a>
                  <a className="pg_main-part3-btnGhost" href="/contact">
                    Solicitar más información
                  </a>
                </div>

                <div className="pg_main-part3-miniNote">
                  Se adapta al tamaño y proceso de tu empresa
                </div>
              </div>
              <motion.div
                className="h1-span-part6"
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                viewport={{ once: true }}
              >
                <div className="pg_main-part3-right">
                  <div className="pg_main-part3-steps">
                    {seceSteps.map((s, i) => (
                      <div key={s.title} className="pg_main-part3-step">
                        <div className="pg_main-part3-stepRail" aria-hidden />
                        <div className="pg_main-part3-stepIcon" aria-hidden>
                          <div className="pg_main-part3-iconSwap">
                            <Image
                              src={s.icon}
                              alt={s.title}
                              width={35}
                              height={35}
                              className="pg_main-part3-iconImg icon-default"
                            />
                            <Image
                              src={s.iconHover}
                              alt={s.title}
                              width={35}
                              height={35}
                              className="pg_main-part3-iconImg icon-hover"
                            />
                          </div>
                        </div>

                        <div className="pg_main-part3-stepBody">
                          <div className="pg_main-part3-stepTop">
                            <h3>{s.title}</h3>
                          </div>
                          <p>{s.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pg_main-part3-statsBar">
                    {seceStats.map((st) => (
                      <div key={st.label} className="pg_main-part3-stat">
                        <div className="pg_main-part3-statNum">{st.value}</div>
                        <div className="pg_main-part3-statLabel">
                          {st.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
        {/*============= Section 4 (Presentation) =============*/}
        <ServicesSection />
        {/*============= Section 5 (Presentation) =============*/}
        <section className="pg_main-presentation-part5">
          <div className="part5-text">
            <h2 className="pg_main-part5-title">
              Empresas que <span className="pg_main-part5-grad">trabajan</span>{" "}
              con nosotros
            </h2>
            <p className="pg_main-part5-subtitle">
              Variedad de empresas alrededor del país deciden confiar en lo que
              hacemos
            </p>
          </div>
          <div className="section5-button">
            <Link href="/contact">Únete a Nosotros</Link>
          </div>
          <div className="section5-carousel">
            <MainCarousel />
          </div>
        </section>
        {/*============= Section 6 (Contact Us) =============*/}
        <section className="pg_main-presentation-part6">
          <div className="pg_cursor-glow" />
          <div className="pg_main-joinus">
            <h1>
              <motion.div
                className="h1-span-part6"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: "easeOut" }}
                viewport={{ once: true }}
              >
                Estas interesado?
              </motion.div>
              <motion.div
                className="h1-span-part6"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: "easeOut" }}
                viewport={{ once: true }}
              >
                Ponte en contacto.
              </motion.div>
            </h1>
            <div className="section6-button">
              <Link href="/contact">Contactanos</Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default Home;
