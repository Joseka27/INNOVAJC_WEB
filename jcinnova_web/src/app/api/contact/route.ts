import { NextResponse } from "next/server";

export const runtime = "nodejs"; // 🔥 IMPORTANTE para que nodemailer funcione

// ===============================
// Rate limit (1 IP cada X segundos)
// ===============================
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

const WINDOW_MS = 3600_000; // ✅ X segundos (10s). Cambia aquí.
const MAX_REQUESTS = 2; // ✅ 1 request por ventana

function getIP(req: Request) {
  // En despliegues con proxy (Vercel, Nginx, etc.)
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0].trim();

  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();

  return "unknown";
}

function rateLimit(ip: string) {
  const now = Date.now();
  const b = buckets.get(ip);

  if (!b || now > b.resetAt) {
    buckets.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true, retryAfterMs: 0 };
  }

  if (b.count >= MAX_REQUESTS) {
    return { ok: false, retryAfterMs: b.resetAt - now };
  }

  b.count += 1;
  buckets.set(ip, b);
  return { ok: true, retryAfterMs: 0 };
}

export async function POST(req: Request) {
  // ✅ Rate limit antes de procesar
  const ip = getIP(req);
  const rl = rateLimit(ip);

  if (!rl.ok) {
    return NextResponse.json(
      {
        error: "Demasiadas solicitudes. Intenta de nuevo en unas horas.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)),
        },
      },
    );
  }

  const nodemailer = require("nodemailer");

  try {
    const body = await req.json();

    const { firstName, lastName, email, phone, region, company, subject } =
      body;

    // ✅ Validación básica
    if (
      !firstName ||
      !lastName ||
      !email ||
      !phone ||
      !region ||
      !company ||
      !subject
    ) {
      return NextResponse.json(
        { error: "Faltan campos requeridos." },
        { status: 400 },
      );
    }

    // ✅ Validar variables de entorno
    if (
      !process.env.SMTP_HOST ||
      !process.env.SMTP_PORT ||
      !process.env.SMTP_USER ||
      !process.env.SMTP_PASS ||
      !process.env.CONTACT_TO
    ) {
      console.error("Faltan variables de entorno SMTP");
      return NextResponse.json(
        { error: "Configuración SMTP incompleta." },
        { status: 500 },
      );
    }

    // ✅ Crear transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false, // Gmail usa false con 587
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // ✅ Enviar correo
    await transporter.sendMail({
      from: `"InnovaJC Web" <${process.env.SMTP_USER}>`,
      to: process.env.CONTACT_TO,
      subject: "Centro de contacto de InnovaJC Web",
      html: `
        <h2>Nueva consulta</h2>
        <p><strong>Nombre:</strong> ${firstName} ${lastName}</p>
        <p><strong>Email de contacto:</strong> ${email}</p>
        <p><strong>Teléfono:</strong> ${phone}</p>
        <p><strong>Región:</strong> ${region}</p>
        <p><strong>De parte de la empresa:</strong> ${company}</p>
        <hr/>
        <p><strong>Mensaje:</strong></p>
        <p>${subject}</p>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error enviando correo:", error);
    return NextResponse.json(
      { error: "Error enviando correo." },
      { status: 500 },
    );
  }
}
