import Link from 'next/link';
import { Navbar } from '@/components/landing/Navbar';
import { Icon, type IconName } from '@/components/ui/Icon';
import './landing.css';

const VARIABLES: { icon: IconName; title: string; desc: string; ideal: string }[] = [
  {
    icon: 'thermometer',
    title: 'Temperatura',
    desc: 'La lechuga crece mejor en climas frescos y estables.',
    ideal: 'Ideal 15–26 °C',
  },
  {
    icon: 'cloud',
    title: 'Humedad ambiental',
    desc: 'El aire húmedo evita que las hojas pierdan agua de más.',
    ideal: 'Ideal 50–80 %',
  },
  {
    icon: 'sun',
    title: 'Luz',
    desc: 'Suficiente luz impulsa la fotosíntesis sin estresar la planta.',
    ideal: 'Ideal 200–40,000 lux',
  },
  {
    icon: 'droplet',
    title: 'Bomba y ventilador',
    desc: 'Enciéndelos desde el dashboard o programa ciclos automáticos de riego.',
    ideal: 'Control remoto',
  },
];

const PREVIEW: { icon: IconName; title: string; value: string; status: string; points: string }[] = [
  { icon: 'thermometer', title: 'Temperatura', value: '19.4 °C', status: 'optimal', points: '0,10 15,14 30,11 45,16 60,13 75,15 100,12' },
  { icon: 'cloud', title: 'Humedad ambiental', value: '64 %', status: 'optimal', points: '0,20 15,17 30,21 45,13 60,16 75,9 100,12' },
  { icon: 'sun', title: 'Luz', value: '180 lux', status: 'warning', points: '0,8 15,12 30,18 45,15 60,22 75,19 100,24' },
  { icon: 'droplet', title: 'Bomba', value: 'Encendida', status: 'optimal', points: '0,24 15,24 30,6 45,6 60,24 75,24 100,6' },
];

export default function LandingPage() {
  return (
    <div className="landing">
      <Navbar />

      <main>
        <section className="hero" id="hero">
          <div className="container hero__inner">
            <div className="hero__content">
              <p className="eyebrow">Hidroponía con IoT e IA</p>
              <h1 className="hero__title">
                Sabe en <span>tiempo real</span> lo que tu lechuga necesita para crecer bien.
              </h1>
              <p className="hero__subtitle">
                HydroGreenAI traduce temperatura, humedad y luz en algo simple: si tu planta está óptima, necesita
                atención o está en estado crítico, y qué hacer al respecto.
              </p>
              <div className="hero__actions">
                <Link className="btn btn--primary btn--lg" href="/login">
                  Comenzar
                </Link>
                <a className="btn btn--ghost btn--lg" href="#como-funciona">
                  Ver cómo funciona
                </a>
              </div>
              <p className="hero__note">
                <Icon name="check" />
                Arduino R4 en un sistema NFT, conectado a la nube
              </p>
            </div>

            <div className="hero__visual" aria-hidden="true">
              <div className="hero__orbit">
                <div className="hero__ring" />
                <div className="hero__center">
                  <Icon name="sprout" />
                </div>
                <span className="hero__chip hero__chip--1">
                  <span><Icon name="droplet" /></span>Bomba ON
                </span>
                <span className="hero__chip hero__chip--2">
                  <span><Icon name="thermometer" /></span>19 °C
                </span>
                <span className="hero__chip hero__chip--3">
                  <span><Icon name="sun" /></span>12,400 lux
                </span>
                <span className="hero__chip hero__chip--4">
                  <span><Icon name="cloud" /></span>Humedad 64 %
                </span>
              </div>
            </div>
          </div>
        </section>

        <section id="producto">
          <div className="container explain__inner">
            <p className="eyebrow">El producto</p>
            <h2 className="section-heading" style={{ fontSize: 'var(--text-xl)' }}>
              Una forma simple de entender lo que tu planta siente
            </h2>
            <p className="section-subtitle" style={{ maxWidth: 620, margin: '0 auto' }}>
              En lugar de números sueltos y difíciles de interpretar, HydroGreenAI convierte las señales del entorno en
              un estado claro para tu cultivo de lechuga, con alertas y recomendaciones explicadas.
            </p>

            <div className="explain__points">
              <div className="explain__point">
                <span className="icon-chip icon-chip--sm"><Icon name="gauge" /></span>
                <div>
                  <p className="explain__point-title">Lecturas claras</p>
                  <p className="explain__point-desc">Sin jerga técnica: solo óptimo, atención o crítico.</p>
                </div>
              </div>
              <div className="explain__point">
                <span className="icon-chip icon-chip--sm"><Icon name="leaf" /></span>
                <div>
                  <p className="explain__point-title">Pensado para lechuga</p>
                  <p className="explain__point-desc">Umbrales ajustados a su ciclo de crecimiento.</p>
                </div>
              </div>
              <div className="explain__point">
                <span className="icon-chip icon-chip--sm"><Icon name="check" /></span>
                <div>
                  <p className="explain__point-title">Recomendaciones con IA</p>
                  <p className="explain__point-desc">Detecta anomalías y te explica qué ajustar.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="band" id="variables">
          <div className="container">
            <div className="section-head section-head--center">
              <p className="eyebrow">Lo que medimos y controlamos</p>
              <h2 className="section-heading" style={{ fontSize: 'var(--text-xl)' }}>
                Todo lo que tu lechuga necesita, en un solo lugar
              </h2>
              <p className="section-subtitle">
                Tres sensores para saber si el ambiente está a favor de tu planta, y dos actuadores para corregirlo.
              </p>
            </div>

            <div className="variables__grid">
              {VARIABLES.map((variable) => (
                <article className="card" key={variable.title}>
                  <span className="icon-chip icon-chip--md"><Icon name={variable.icon} /></span>
                  <h3 className="variable-card__title">{variable.title}</h3>
                  <p className="variable-card__desc">{variable.desc}</p>
                  <span className="chip chip--neutral">{variable.ideal}</span>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="como-funciona">
          <div className="container">
            <div className="section-head section-head--center">
              <p className="eyebrow">Cómo funciona</p>
              <h2 className="section-heading" style={{ fontSize: 'var(--text-xl)' }}>
                De la planta a la pantalla, en tres pasos
              </h2>
            </div>

            <div className="steps__list">
              <div className="step">
                <div className="step__number">1</div>
                <p className="step__title">El Arduino mide cada 30 s</p>
                <p className="step__desc">Temperatura, humedad y luz viajan por MQTT a la nube.</p>
              </div>
              <div className="step">
                <div className="step__number">2</div>
                <p className="step__title">Cada lectura se evalúa</p>
                <p className="step__desc">Se compara contra los umbrales de la lechuga y la IA busca anomalías.</p>
              </div>
              <div className="step">
                <div className="step__number">3</div>
                <p className="step__title">Ves el estado y actúas</p>
                <p className="step__desc">El dashboard te alerta y te deja encender la bomba o el ventilador.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="band" id="dashboard-preview">
          <div className="container preview__inner">
            <p className="eyebrow">El dashboard</p>
            <h2 className="section-heading" style={{ fontSize: 'var(--text-xl)' }}>
              Toda la información, de un vistazo
            </h2>
            <p className="section-subtitle" style={{ margin: '0 auto' }}>
              Tarjetas claras por variable, con su tendencia reciente y el estado de salud de tu lechuga.
            </p>

            <div className="device-frame">
              <div className="device-frame__bar">
                <span className="device-frame__dot" />
                <span className="device-frame__dot" />
                <span className="device-frame__dot" />
              </div>
              <div className="device-frame__body">
                <div className="preview-header">
                  <span className="preview-header__title">HydroGreenAI — Monitor de lechuga</span>
                  <span className="chip chip--warning">Atención</span>
                </div>

                <div className="preview-grid">
                  {PREVIEW.map((card) => (
                    <article className="card preview-card" data-status={card.status} key={card.title}>
                      <span className="icon-chip icon-chip--sm"><Icon name={card.icon} /></span>
                      <p className="preview-card__title">{card.title}</p>
                      <p className="preview-card__value">{card.value}</p>
                      <svg className="preview-card__spark" viewBox="0 0 100 30" preserveAspectRatio="none">
                        <polyline
                          points={card.points}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2.5}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </article>
                  ))}
                </div>
              </div>
            </div>

            <div className="preview__cta">
              <Link className="btn btn--primary btn--lg" href="/login">
                Explorar el dashboard completo
              </Link>
            </div>
          </div>
        </section>

        <section id="cta-final">
          <div className="container">
            <div className="cta-band">
              <h2 className="cta-band__heading">Empieza a monitorear tu lechuga hoy</h2>
              <p className="cta-band__subtitle">Abre el dashboard y observa tu cultivo en vivo.</p>
              <Link className="btn btn--on-dark btn--lg" href="/login">
                Comenzar ahora
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container">
          <div className="footer__inner">
            <div className="footer__brand">
              <a className="brand" href="#hero">
                <span className="brand-mark"><Icon name="leaf" /></span>
                <span className="brand__name">HydroGreenAI</span>
              </a>
              <p className="footer__tagline">Cuidado inteligente para tu cultivo hidropónico de lechuga.</p>
            </div>

            <div className="footer__links">
              <div className="footer__col">
                <h4>Producto</h4>
                <ul>
                  <li><a href="#producto">Producto</a></li>
                  <li><a href="#variables">Variables</a></li>
                  <li><a href="#como-funciona">Cómo funciona</a></li>
                </ul>
              </div>
              <div className="footer__col">
                <h4>Aplicación</h4>
                <ul>
                  <li><Link href="/login">Dashboard</Link></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="footer__bottom">
            <span>© 2026 HydroGreenAI: Lettuce</span>
            <span>Proyecto universitario — UPAEP, Administración Ágil.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
