import "./not-found.css";
import { Roboto } from "next/font/google";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});

export default function NotFound() {
  return (
    <div className={`pg_nf_wrapper ${roboto.className}`}>
      <div className="pg_nf">
        <div className="pg_nf_card">
          <div className="pg_nf_badge">404</div>

          <h1 className="pg_nf_title">Página no encontrada</h1>

          <p className="pg_nf_subtitle">
            Lo sentimos, la página que estás buscando no existe o fue movida.
          </p>
        </div>
      </div>
    </div>
  );
}
