'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';

const LINKS = [
  { href: '#producto', label: 'Producto' },
  { href: '#variables', label: 'Variables' },
  { href: '#como-funciona', label: 'Cómo funciona' },
  { href: '#dashboard-preview', label: 'Dashboard' },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <nav className={`navbar${open ? ' is-open' : ''}`} id="navbar">
      <div className="container navbar__inner">
        <a className="brand" href="#hero">
          <span className="brand-mark">
            <Icon name="leaf" />
          </span>
          <span className="brand__name">HydroGreenAI</span>
        </a>

        <button
          className="navbar__toggle"
          type="button"
          aria-label="Abrir menú"
          aria-expanded={open}
          aria-controls="navPanel"
          onClick={() => setOpen((value) => !value)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>

        <div className="navbar__panel" id="navPanel">
          <ul className="navbar__links">
            {LINKS.map((link) => (
              <li key={link.href}>
                <a href={link.href} onClick={close}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <Link className="btn btn--primary" href="/login" onClick={close}>
            Comenzar
          </Link>
        </div>
      </div>
    </nav>
  );
}
