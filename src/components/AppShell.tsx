import type { ReactNode } from "react";

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#workspace">
        Ir al contenido principal
      </a>
      <header className="topbar">
        <div className="topbar-brand">
          <img
            src={`${import.meta.env.BASE_URL}clinic_logo.svg`}
            alt="Clínic Barcelona"
            width={332}
            height={142}
            className="topbar-logo"
          />
        </div>
        <a
          className="btn topbar-collaborate"
          href="https://www.clinicbarcelona.org/colabora/amics-del-clinic"
        >
          COLABORA
        </a>
      </header>
      <main id="workspace" className="workspace" tabIndex={-1}>
        {children}
      </main>
      <footer className="app-footer" aria-label="Contacto institucional">
        <div className="footer-contacts">
          <address>
            <a className="font-semibold text-content-inverse" href="https://www.clinicbarcelona.org/ubicacion-y-contacto/investigacion">IDIBAPS</a>
            <span>C/ Mallorca, 183</span>
            <span>08036 Barcelona</span>
            <a href="tel:+34932275707">+34 93 227 57 07</a>
          </address>
          <address>
            <a className="font-semibold text-content-inverse" href="https://www.clinicbarcelona.org/ubicacion-y-contacto/contacto-para-pacientes/hospital-clinic">Hospital Clínic de Barcelona</a>
            <span>C/ Villarroel, 170</span>
            <span>08036 Barcelona</span>
            <a href="tel:+34932275400">+34 93 227 54 00</a>
          </address>
        </div>
        <div className="footer-bottom">
          <small>© Clínic Barcelona 2026</small>
          <span lang="es">Español</span>
        </div>
      </footer>
    </div>
  );
}
