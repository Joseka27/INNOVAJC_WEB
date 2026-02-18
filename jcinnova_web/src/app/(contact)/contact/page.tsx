"use client";

import { useEffect, useMemo, useState } from "react";
import "./contact.css";

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  region: string;
  company: string;
  subject: string;
  honey: string;
};

type FieldName = keyof Omit<FormState, "honey">;

const MAX_SUBJECT = 2000;

function isEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

function clean(s: string) {
  return s.trim();
}

export default function ContactPage() {
  const [form, setForm] = useState<FormState>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    region: "",
    company: "",
    subject: "",
    honey: "",
  });

  const [touched, setTouched] = useState<Record<FieldName, boolean>>({
    firstName: false,
    lastName: false,
    email: false,
    phone: false,
    region: false,
    company: false,
    subject: false,
  });

  const [focused, setFocused] = useState<FieldName | null>(null);

  const [errors, setErrors] = useState<Record<FieldName, string>>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    region: "",
    company: "",
    subject: "",
  });

  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<null | {
    type: "ok" | "err";
    msg: string;
  }>(null);

  // ✅ BONUS: si es OK, desaparece solo en 3 segundos
  useEffect(() => {
    if (status?.type === "ok") {
      const timer = setTimeout(() => {
        setStatus(null);
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [status]);

  function validateField(name: FieldName, value: string): string {
    const v = clean(value);

    if (!v) return "Este campo es requerido.";

    if (name === "email" && !isEmail(v)) return "Correo inválido.";

    if (name === "subject" && v.length > MAX_SUBJECT) {
      return "El mensaje es demasiado largo.";
    }

    return "";
  }

  function handleFocus(name: FieldName) {
    setFocused(name);
    // quita error visual mientras escribe
    setErrors((p) => ({ ...p, [name]: "" }));
  }

  function handleBlur(name: FieldName) {
    setTouched((p) => ({ ...p, [name]: true }));
    const err = validateField(name, form[name]);
    setErrors((p) => ({ ...p, [name]: err }));
    setFocused((p) => (p === name ? null : p));
  }

  function handleChange(name: FieldName, value: string) {
    setForm((p) => ({ ...p, [name]: value }) as FormState);

    if (touched[name]) {
      const err = validateField(name, value);
      setErrors((p) => ({ ...p, [name]: err }));
    }
  }

  const canSend = useMemo(() => {
    if (sending) return false;
    const all: FieldName[] = [
      "firstName",
      "lastName",
      "email",
      "phone",
      "region",
      "company",
      "subject",
    ];
    return all.every((f) => !validateField(f, form[f]));
  }, [form, sending]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);

    // honeypot anti-bot
    if (form.honey.trim()) {
      setStatus({ type: "ok", msg: "Enviado." });
      return;
    }

    const all: FieldName[] = [
      "firstName",
      "lastName",
      "email",
      "phone",
      "region",
      "company",
      "subject",
    ];

    // forzar touched + validar todo
    const nextTouched = { ...touched };
    const nextErrors = { ...errors };

    for (const f of all) {
      nextTouched[f] = true;
      nextErrors[f] = validateField(f, form[f]);
    }

    setTouched(nextTouched);
    setErrors(nextErrors);

    const hasError = all.some((f) => nextErrors[f]);
    if (hasError) {
      setStatus({
        type: "err",
        msg: "Revisa los campos: todos son requeridos y el correo debe ser válido.",
      });
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: clean(form.firstName),
          lastName: clean(form.lastName),
          email: clean(form.email),
          phone: clean(form.phone),
          region: clean(form.region),
          company: clean(form.company),
          subject: clean(form.subject),
        }),
      });

      const raw = await res.text();
      let data: any = null;
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {}

      if (!res.ok) {
        setStatus({
          type: "err",
          msg: data?.error ?? "No se pudo enviar el mensaje. Intenta de nuevo.",
        });
        return;
      }

      setStatus({ type: "ok", msg: "¡Listo! Tu mensaje fue enviado." });

      setForm({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        region: "",
        company: "",
        subject: "",
        honey: "",
      });

      setTouched({
        firstName: false,
        lastName: false,
        email: false,
        phone: false,
        region: false,
        company: false,
        subject: false,
      });

      setErrors({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        region: "",
        company: "",
        subject: "",
      });

      setFocused(null);
    } catch (err: any) {
      setStatus({
        type: "err",
        msg: err?.message ?? "Error inesperado enviando el mensaje.",
      });
    } finally {
      setSending(false);
    }
  }

  // helpers visuales por campo
  function fieldUI(name: FieldName) {
    const err = touched[name] ? errors[name] : "";
    const isFocused = focused === name;
    const ok = touched[name] && !err && !!clean(form[name]);
    return { err, isFocused, ok };
  }

  return (
    <div className="ct_pg">
      <div className="ct_shell">
        <div className="ct_grid">
          {/* LEFT */}
          <section className="ct_left">
            <div className="ct_leftInner">
              <h1 className="ct_title">
                Contacta directamente
                <br />
                con nosotros
              </h1>
              <p className="ct_subtitle">Todos los campos son requeridos</p>

              <form className="ct_form" onSubmit={onSubmit}>
                {/* Row 2 */}
                <div className="ct_row2">
                  {/* First name */}
                  <div className="ct_field">
                    {(() => {
                      const { err, isFocused, ok } = fieldUI("firstName");
                      return (
                        <>
                          {err && !isFocused ? (
                            <div className="ct_errorTooltip">{err}</div>
                          ) : null}

                          <input
                            className={[
                              "ct_control",
                              "ct_input",
                              err ? "is-error" : "",
                              ok ? "is-success" : "",
                            ].join(" ")}
                            placeholder="Nombre"
                            value={form.firstName}
                            name="firstName"
                            autoComplete="given-name"
                            onChange={(e) =>
                              handleChange("firstName", e.target.value)
                            }
                            onBlur={() => handleBlur("firstName")}
                            onFocus={() => handleFocus("firstName")}
                          />

                          {err && !isFocused ? (
                            <span className="ct_icon is-error" aria-hidden>
                              <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                              >
                                <path
                                  d="M12 2a10 10 0 1 0 .001 20.001A10 10 0 0 0 12 2Z"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                />
                                <path
                                  d="M12 7v7"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                />
                                <path
                                  d="M12 17h.01"
                                  stroke="currentColor"
                                  strokeWidth="3"
                                  strokeLinecap="round"
                                />
                              </svg>
                            </span>
                          ) : ok ? (
                            <span className="ct_icon is-success" aria-hidden>
                              <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                              >
                                <path
                                  d="M20 6 9 17l-5-5"
                                  stroke="currentColor"
                                  strokeWidth="2.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </span>
                          ) : null}
                        </>
                      );
                    })()}
                  </div>

                  {/* Last name */}
                  <div className="ct_field">
                    {(() => {
                      const { err, isFocused, ok } = fieldUI("lastName");
                      return (
                        <>
                          {err && !isFocused ? (
                            <div className="ct_errorTooltip">{err}</div>
                          ) : null}

                          <input
                            className={[
                              "ct_control",
                              "ct_input",
                              err ? "is-error" : "",
                              ok ? "is-success" : "",
                            ].join(" ")}
                            placeholder="Apellido"
                            value={form.lastName}
                            name="lastName"
                            autoComplete="family-name"
                            onChange={(e) =>
                              handleChange("lastName", e.target.value)
                            }
                            onBlur={() => handleBlur("lastName")}
                            onFocus={() => handleFocus("lastName")}
                          />

                          {err && !isFocused ? (
                            <span className="ct_icon is-error" aria-hidden>
                              <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                              >
                                <path
                                  d="M12 2a10 10 0 1 0 .001 20.001A10 10 0 0 0 12 2Z"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                />
                                <path
                                  d="M12 7v7"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                />
                                <path
                                  d="M12 17h.01"
                                  stroke="currentColor"
                                  strokeWidth="3"
                                  strokeLinecap="round"
                                />
                              </svg>
                            </span>
                          ) : ok ? (
                            <span className="ct_icon is-success" aria-hidden>
                              <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                              >
                                <path
                                  d="M20 6 9 17l-5-5"
                                  stroke="currentColor"
                                  strokeWidth="2.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </span>
                          ) : null}
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Email */}
                <div className="ct_field">
                  {(() => {
                    const { err, isFocused, ok } = fieldUI("email");
                    return (
                      <>
                        {err && !isFocused ? (
                          <div className="ct_errorTooltip">{err}</div>
                        ) : null}

                        <input
                          className={[
                            "ct_control",
                            "ct_input",
                            err ? "is-error" : "",
                            ok ? "is-success" : "",
                          ].join(" ")}
                          placeholder="Correo"
                          value={form.email}
                          name="email"
                          type="email"
                          inputMode="email"
                          autoComplete="email"
                          onChange={(e) =>
                            handleChange("email", e.target.value)
                          }
                          onBlur={() => handleBlur("email")}
                          onFocus={() => handleFocus("email")}
                        />

                        {err && !isFocused ? (
                          <span className="ct_icon is-error" aria-hidden>
                            <svg
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <path
                                d="M12 2a10 10 0 1 0 .001 20.001A10 10 0 0 0 12 2Z"
                                stroke="currentColor"
                                strokeWidth="2"
                              />
                              <path
                                d="M12 7v7"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                              />
                              <path
                                d="M12 17h.01"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeLinecap="round"
                              />
                            </svg>
                          </span>
                        ) : ok ? (
                          <span className="ct_icon is-success" aria-hidden>
                            <svg
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <path
                                d="M20 6 9 17l-5-5"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </span>
                        ) : null}
                      </>
                    );
                  })()}
                </div>

                {/* Phone */}
                <div className="ct_field">
                  {(() => {
                    const { err, isFocused, ok } = fieldUI("phone");
                    return (
                      <>
                        {err && !isFocused ? (
                          <div className="ct_errorTooltip">{err}</div>
                        ) : null}

                        <input
                          className={[
                            "ct_control",
                            "ct_input",
                            err ? "is-error" : "",
                            ok ? "is-success" : "",
                          ].join(" ")}
                          placeholder="Telefono"
                          value={form.phone}
                          name="phone"
                          type="tel"
                          inputMode="tel"
                          autoComplete="tel"
                          onChange={(e) =>
                            handleChange("phone", e.target.value)
                          }
                          onBlur={() => handleBlur("phone")}
                          onFocus={() => handleFocus("phone")}
                        />

                        {err && !isFocused ? (
                          <span className="ct_icon is-error" aria-hidden>
                            <svg
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <path
                                d="M12 2a10 10 0 1 0 .001 20.001A10 10 0 0 0 12 2Z"
                                stroke="currentColor"
                                strokeWidth="2"
                              />
                              <path
                                d="M12 7v7"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                              />
                              <path
                                d="M12 17h.01"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeLinecap="round"
                              />
                            </svg>
                          </span>
                        ) : ok ? (
                          <span className="ct_icon is-success" aria-hidden>
                            <svg
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <path
                                d="M20 6 9 17l-5-5"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </span>
                        ) : null}
                      </>
                    );
                  })()}
                </div>

                {/* Region */}
                <div className="ct_field">
                  {(() => {
                    const { err, isFocused, ok } = fieldUI("region");
                    return (
                      <>
                        {err && !isFocused ? (
                          <div className="ct_errorTooltip">{err}</div>
                        ) : null}

                        <input
                          className={[
                            "ct_control",
                            "ct_input",
                            err ? "is-error" : "",
                            ok ? "is-success" : "",
                          ].join(" ")}
                          placeholder="Region"
                          value={form.region}
                          name="region"
                          onChange={(e) =>
                            handleChange("region", e.target.value)
                          }
                          onBlur={() => handleBlur("region")}
                          onFocus={() => handleFocus("region")}
                        />

                        {err && !isFocused ? (
                          <span className="ct_icon is-error" aria-hidden>
                            <svg
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <path
                                d="M12 2a10 10 0 1 0 .001 20.001A10 10 0 0 0 12 2Z"
                                stroke="currentColor"
                                strokeWidth="2"
                              />
                              <path
                                d="M12 7v7"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                              />
                              <path
                                d="M12 17h.01"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeLinecap="round"
                              />
                            </svg>
                          </span>
                        ) : ok ? (
                          <span className="ct_icon is-success" aria-hidden>
                            <svg
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <path
                                d="M20 6 9 17l-5-5"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </span>
                        ) : null}
                      </>
                    );
                  })()}
                </div>

                {/* Company */}
                <div className="ct_field">
                  {(() => {
                    const { err, isFocused, ok } = fieldUI("company");
                    return (
                      <>
                        {err && !isFocused ? (
                          <div className="ct_errorTooltip">{err}</div>
                        ) : null}

                        <input
                          className={[
                            "ct_control",
                            "ct_input",
                            err ? "is-error" : "",
                            ok ? "is-success" : "",
                          ].join(" ")}
                          placeholder="Empresa"
                          value={form.company}
                          name="company"
                          onChange={(e) =>
                            handleChange("company", e.target.value)
                          }
                          onBlur={() => handleBlur("company")}
                          onFocus={() => handleFocus("company")}
                        />

                        {err && !isFocused ? (
                          <span className="ct_icon is-error" aria-hidden>
                            <svg
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <path
                                d="M12 2a10 10 0 1 0 .001 20.001A10 10 0 0 0 12 2Z"
                                stroke="currentColor"
                                strokeWidth="2"
                              />
                              <path
                                d="M12 7v7"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                              />
                              <path
                                d="M12 17h.01"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeLinecap="round"
                              />
                            </svg>
                          </span>
                        ) : ok ? (
                          <span className="ct_icon is-success" aria-hidden>
                            <svg
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <path
                                d="M20 6 9 17l-5-5"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </span>
                        ) : null}
                      </>
                    );
                  })()}
                </div>

                {/* Subject / Asunto */}
                <div className="ct_field">
                  {(() => {
                    const { err, isFocused, ok } = fieldUI("subject");
                    return (
                      <>
                        {err && !isFocused ? (
                          <div className="ct_errorTooltip">{err}</div>
                        ) : null}

                        <textarea
                          className={[
                            "ct_control",
                            "ct_textarea",
                            err ? "is-error" : "",
                            ok ? "is-success" : "",
                          ].join(" ")}
                          placeholder="Asunto"
                          value={form.subject}
                          name="subject"
                          onChange={(e) =>
                            handleChange("subject", e.target.value)
                          }
                          onBlur={() => handleBlur("subject")}
                          onFocus={() => handleFocus("subject")}
                          rows={4}
                          maxLength={MAX_SUBJECT}
                        />

                        {err && !isFocused ? (
                          <span className="ct_icon is-error" aria-hidden>
                            <svg
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <path
                                d="M12 2a10 10 0 1 0 .001 20.001A10 10 0 0 0 12 2Z"
                                stroke="currentColor"
                                strokeWidth="2"
                              />
                              <path
                                d="M12 7v7"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                              />
                              <path
                                d="M12 17h.01"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeLinecap="round"
                              />
                            </svg>
                          </span>
                        ) : ok ? (
                          <span className="ct_icon is-success" aria-hidden>
                            <svg
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <path
                                d="M20 6 9 17l-5-5"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </span>
                        ) : null}
                      </>
                    );
                  })()}
                </div>

                {/* honeypot */}
                <input
                  className="ct_hp"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  value={form.honey}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, honey: e.target.value }))
                  }
                />

                <button className="ct_btn" type="submit" disabled={!canSend}>
                  {sending ? "Enviando…" : "Enviar"}
                </button>

                {status ? (
                  <div
                    className={`ct_status ${
                      status.type === "ok" ? "is-ok" : "is-err"
                    }`}
                    role="status"
                  >
                    {status.msg}
                  </div>
                ) : null}
              </form>
            </div>
          </section>

          {/* RIGHT */}
          <aside className="ct_right">
            <div className="ct_rightInner">
              {(() => {
                const title = "Ubicación";
                const label = "Nuestra oficina";
                const addressLine1 =
                  "650mts Oeste del supermercado Rosvil Tacares";
                const addressLine2 = "Tacares / Alajuela";
                const query = "INNOVAJC S.A";

                const finalMapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  query,
                )}`;

                const finalEmbedUrl = `https://www.google.com/maps?q=${encodeURIComponent(
                  query,
                )}&output=embed`;

                return (
                  <>
                    <div className="ct_mapCard">
                      <iframe
                        className="ct_map"
                        title={title}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        src={finalEmbedUrl}
                      />
                    </div>

                    <div className="ct_infoCard">
                      <div className="ct_infoTitle">{label}</div>

                      <div className="ct_infoText">
                        <div>{addressLine1}</div>
                        <div>{addressLine2}</div>

                        <div className="ct_infoSep" />
                        <div>Teléfono: (+506) 4070-1423</div>
                        <div>Email: ajimenez@innovajc.com</div>

                        <div className="ct_infoSep" />

                        <a
                          href={finalMapsLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ textDecoration: "underline" }}
                        >
                          Ver en Google Maps →
                        </a>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
