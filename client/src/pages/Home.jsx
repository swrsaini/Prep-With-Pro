import React from 'react';
import { Link } from 'react-router-dom';

const features = [
  ['01', 'Practice Engine', 'Turn a large question bank into a focused daily session.'],
  ['02', 'Mock Exams', 'Build timed tests that feel like the real thing.'],
  ['03', 'Progress Analytics', 'See what is sticking and where your next hour matters.'],
  ['04', 'Bookmarks', 'Keep the questions worth a second look close at hand.'],
];

function Home() {
  return (
    <main className="home-page">
      <nav className="home-nav" aria-label="Primary navigation">
        <Link className="home-brand" to="/">
          <span className="brand-mark">P</span>
          <span>Prep With Pro</span>
        </Link>
        <div className="home-nav-actions">
          <Link className="text-link" to="/login">Log in</Link>
          <Link className="btn btn-primary home-nav-cta" to="/register">Create account</Link>
        </div>
      </nav>

      <section className="home-hero">
        <div className="hero-copy">
          <p className="eyebrow">A sharper way to prepare</p>
          <h1>Make every question<br /><em>move you forward.</em></h1>
          <p className="hero-subtitle">
            Prep With Pro brings practice, mock exams, and honest progress tracking
            into one calm workspace built for serious preparation.
          </p>
          <div className="hero-actions">
            <Link className="btn btn-primary" to="/register">Start preparing</Link>
            <Link className="hero-secondary-link" to="/login">I already have an account <span aria-hidden="true">-&gt;</span></Link>
          </div>
          <div className="hero-proof">
            <span className="proof-dot" />
            <span>Built for consistent, focused study</span>
          </div>
        </div>

        <div className="hero-visual" aria-label="Study progress overview">
          <div className="visual-grid" />
          <div className="progress-orbit orbit-one" />
          <div className="progress-orbit orbit-two" />
          <div className="hero-score-card glass-card">
            <div className="score-card-top"><span>WEEKLY FOCUS</span><span className="score-status">ON TRACK</span></div>
            <div className="score-number">72<span>%</span></div>
            <div className="score-bar"><span /></div>
            <div className="score-card-bottom"><span>36 of 50 questions</span><strong>+240 XP</strong></div>
          </div>
          <div className="hero-note glass-card">
            <span className="note-kicker">NEXT UP</span>
            <strong>Computer Graphics</strong>
            <span>12 questions waiting</span>
          </div>
          <div className="hero-stamp">STUDY<br />WITH<br />INTENT</div>
        </div>
      </section>

      <section className="feature-section">
        <div className="section-heading">
          <p className="eyebrow">Everything in one rhythm</p>
          <h2>Less setup.<br /><span>More momentum.</span></h2>
        </div>
        <div className="feature-list">
          {features.map(([number, title, description]) => (
            <article className="feature-row" key={title}>
              <span className="feature-number">{number}</span>
              <h3>{title}</h3>
              <p>{description}</p>
              <span className="feature-arrow" aria-hidden="true">-&gt;</span>
            </article>
          ))}
        </div>
      </section>

      <footer className="home-footer">
        <span>Prep With Pro</span>
        <span>Practice with purpose.</span>
      </footer>
    </main>
  );
}

export default Home;
