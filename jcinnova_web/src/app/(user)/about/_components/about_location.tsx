"use client";

import "./about_location.css";
import Image from "next/image";

type Props = {
  title?: string;
  label?: string;
  addressLine1?: string;
  addressLine2?: string;
  mapsLink?: string;
  query?: string;
  embed?: boolean;
  embedUrl?: string;
};

export default function LocationMap({
  title = "Ubicación",
  label = "Nuestra oficina",
  addressLine1 = "650mts Oeste del supermercado Rosvil Tacares",
  addressLine2 = "Tacares / Alajuela",
  mapsLink,
  query = "INNOVAJC S.A",
  embed = true,
  embedUrl,
}: Props) {
  const finalMapsLink =
    mapsLink ??
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

  const finalEmbedUrl =
    embedUrl ??
    `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;

  return (
    <section className="locmap" aria-label="Sección de ubicación">
      <div className="locmap_inner">
        {/* LEFT */}
        <div className="locmap_left">
          <div className="ubication_section">
            <Image
              src="/images/mainpage/Ubication.png"
              alt="Ubication"
              width={28}
              height={28}
              priority
            />
            <span className="locmap_ubication">{title}</span>
          </div>
          <h2 className="locmap_title">
            Estamos ubicados en Tacares de Grecia
          </h2>

          <div className="locmap_block">
            <div className="locmap_label">{label}</div>
            <div className="locmap_addr">{addressLine1}</div>
            <div className="locmap_addr">{addressLine2}</div>
          </div>

          <div className="locmap_actions">
            <a
              className="locmap_btn"
              href={finalMapsLink}
              target="_blank"
              rel="noreferrer"
            >
              Abrir en Google Maps →
            </a>
          </div>
        </div>

        {/* RIGHT */}
        <div className="locmap_right">
          <div className="locmap_mapCard">
            {embed ? (
              <iframe
                className="locmap_iframe"
                src={finalEmbedUrl}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                aria-label="Mapa"
              />
            ) : (
              <div className="locmap_placeholder" aria-hidden>
                <div className="locmap_pin" />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
