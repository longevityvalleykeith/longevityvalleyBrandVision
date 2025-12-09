'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';

/**
 * Longevity Valley Hero Landing Page
 *
 * An immersive introduction to the world of the Agentic Factory.
 * Features cinematic transitions, ambient animations, and a
 * compelling narrative that draws users into the experience.
 */

// Director icons as simple text to avoid emoji hydration issues
const DIRECTOR_ICONS = {
  newtonian: 'N',
  visionary: 'V',
  minimalist: 'M',
  provocateur: 'P',
};

export default function HeroPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    setIsMounted(true);

    // Auto-rotate features
    const interval = setInterval(() => {
      setActiveFeature(prev => (prev + 1) % 4);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: 'N',
      color: '#3b82f6',
      title: 'The Newtonian',
      subtitle: 'Physics-Perfect Motion',
      description: 'Every frame respects the laws of physics. Realistic motion that builds trust.',
    },
    {
      icon: 'V',
      color: '#8b5cf6',
      title: 'The Visionary',
      subtitle: 'Ethereal Dreamscapes',
      description: 'Transform your brand into art. Emotional resonance through visual poetry.',
    },
    {
      icon: 'M',
      color: '#6b7280',
      title: 'The Minimalist',
      subtitle: 'Less, But Better',
      description: 'Clean, intentional design. Every element earns its place.',
    },
    {
      icon: 'P',
      color: '#ef4444',
      title: 'The Provocateur',
      subtitle: 'Break The Rules',
      description: 'Unexpected. Bold. Unforgettable. Content that demands attention.',
    },
  ];

  return (
    <div className="hero-page" suppressHydrationWarning>
      {/* Ambient Background */}
      <div className="ambient-bg">
        <div className="gradient-orb orb-1" />
        <div className="gradient-orb orb-2" />
        <div className="gradient-orb orb-3" />
        <div className="noise-overlay" />
      </div>

      {/* Main Content */}
      <main className={`hero-content ${isMounted ? 'loaded' : ''}`} suppressHydrationWarning>
        {/* Logo & Brand */}
        <header className="hero-header">
          <div className="brand-mark">
            <span className="brand-icon">LV</span>
            <span className="brand-text">LONGEVITY VALLEY</span>
          </div>
        </header>

        {/* Hero Section */}
        <section className="hero-section">
          <h1 className="hero-title">
            <span className="title-line">The Agentic</span>
            <span className="title-line accent">Content Factory</span>
          </h1>

          <p className="hero-subtitle">
            Four AI Directors. One Vision. Infinite Possibilities.
          </p>

          <p className="hero-description">
            Upload your brand. Watch as four distinct creative minds compete
            to transform it into cinema-quality video content.
          </p>

          {/* CTA Buttons */}
          <div className="cta-group">
            <Link href="/lounge" className="cta-primary">
              <span className="cta-icon-wrapper">
                <svg className="cta-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </span>
              <span className="cta-text">
                <span className="cta-main">Enter The Lounge</span>
                <span className="cta-sub">Meet Your Directors</span>
              </span>
            </Link>

            <Link href="/studio" className="cta-secondary">
              Quick Analysis
            </Link>
          </div>
        </section>

        {/* Director Showcase */}
        <section className="director-showcase" suppressHydrationWarning>
          <h2 className="section-label">YOUR CREATIVE COUNCIL</h2>

          <div className="director-cards">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className={`director-card ${isMounted && index === activeFeature ? 'active' : ''}`}
                onMouseEnter={() => setActiveFeature(index)}
                suppressHydrationWarning
              >
                <div className="card-glow" />
                <span
                  className="card-icon"
                  style={{ background: feature.color }}
                >
                  {feature.icon}
                </span>
                <h3 className="card-title">{feature.title}</h3>
                <p className="card-subtitle">{feature.subtitle}</p>
                <p className="card-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Value Props */}
        <section className="value-section">
          <div className="value-grid">
            <div className="value-item">
              <span className="value-number">4</span>
              <span className="value-label">AI Directors</span>
            </div>
            <div className="value-item">
              <span className="value-number">2</span>
              <span className="value-label">Video Engines</span>
            </div>
            <div className="value-item">
              <span className="value-number">∞</span>
              <span className="value-label">Possibilities</span>
            </div>
          </div>
        </section>

        {/* Tech Stack Badge */}
        <footer className="hero-footer">
          <div className="tech-badge">
            <div className="status-dot" />
            <span>Powered by Gemini 2.0 + DeepSeek V3 + Kling + Luma</span>
          </div>
        </footer>
      </main>

      <style>{`
        .hero-page {
          min-height: 100vh;
          background: #050505;
          color: white;
          overflow: hidden;
          position: relative;
        }

        /* Ambient Background */
        .ambient-bg {
          position: fixed;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
        }

        .gradient-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(100px);
          opacity: 0.5;
          animation: float 20s ease-in-out infinite;
        }

        .orb-1 {
          width: 600px;
          height: 600px;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          top: -200px;
          left: -200px;
          animation-delay: 0s;
        }

        .orb-2 {
          width: 500px;
          height: 500px;
          background: linear-gradient(135deg, #ec4899 0%, #f97316 100%);
          bottom: -200px;
          right: -200px;
          animation-delay: -7s;
        }

        .orb-3 {
          width: 400px;
          height: 400px;
          background: linear-gradient(135deg, #06b6d4 0%, #10b981 100%);
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation-delay: -14s;
          opacity: 0.3;
        }

        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(50px, -50px) scale(1.1); }
          50% { transform: translate(-30px, 30px) scale(0.9); }
          75% { transform: translate(30px, 50px) scale(1.05); }
        }

        .noise-overlay {
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          opacity: 0.03;
        }

        /* Main Content */
        .hero-content {
          position: relative;
          z-index: 10;
          max-width: 1200px;
          margin: 0 auto;
          padding: 40px 24px;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.8s ease-out;
        }

        .hero-content.loaded {
          opacity: 1;
          transform: translateY(0);
        }

        /* Header */
        .hero-header {
          display: flex;
          justify-content: center;
          margin-bottom: 60px;
        }

        .brand-mark {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 24px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 999px;
        }

        .brand-icon {
          font-size: 0.875rem;
          font-weight: 800;
          background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .brand-text {
          font-size: 0.875rem;
          font-weight: 600;
          letter-spacing: 0.2em;
          color: rgba(255, 255, 255, 0.9);
        }

        /* Hero Section */
        .hero-section {
          text-align: center;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 40px 0;
        }

        .hero-title {
          font-size: clamp(3rem, 10vw, 6rem);
          font-weight: 800;
          line-height: 1.1;
          margin: 0 0 24px;
        }

        .title-line {
          display: block;
        }

        .title-line.accent {
          background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 50%, #f97316 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero-subtitle {
          font-size: 1.5rem;
          color: rgba(255, 255, 255, 0.7);
          margin: 0 0 16px;
          font-weight: 300;
        }

        .hero-description {
          font-size: 1.125rem;
          color: rgba(255, 255, 255, 0.5);
          max-width: 500px;
          line-height: 1.6;
          margin: 0 0 40px;
        }

        /* CTA Buttons */
        .cta-group {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .cta-primary {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 32px;
          background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
          border-radius: 16px;
          text-decoration: none;
          color: white;
          font-weight: 600;
          transition: all 0.3s;
          box-shadow: 0 4px 30px rgba(139, 92, 246, 0.4);
        }

        .cta-primary:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 40px rgba(139, 92, 246, 0.5);
        }

        .cta-icon-wrapper {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 10px;
        }

        .cta-icon-svg {
          width: 20px;
          height: 20px;
          fill: white;
          stroke: white;
        }

        .cta-text {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }

        .cta-main {
          font-size: 1.125rem;
        }

        .cta-sub {
          font-size: 0.75rem;
          opacity: 0.7;
        }

        .cta-secondary {
          padding: 16px 32px;
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 16px;
          text-decoration: none;
          color: rgba(255, 255, 255, 0.7);
          font-weight: 600;
          transition: all 0.3s;
        }

        .cta-secondary:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.3);
          color: white;
        }

        /* Director Showcase */
        .director-showcase {
          margin-top: 60px;
        }

        .section-label {
          text-align: center;
          font-size: 0.75rem;
          letter-spacing: 0.2em;
          color: rgba(255, 255, 255, 0.4);
          margin: 0 0 32px;
        }

        .director-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
        }

        .director-card {
          position: relative;
          padding: 24px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          transition: all 0.4s;
          overflow: hidden;
        }

        .director-card:hover,
        .director-card.active {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(139, 92, 246, 0.3);
          transform: translateY(-4px);
        }

        .card-glow {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 100px;
          background: linear-gradient(180deg, rgba(139, 92, 246, 0.1) 0%, transparent 100%);
          opacity: 0;
          transition: opacity 0.4s;
        }

        .director-card.active .card-glow {
          opacity: 1;
        }

        .card-icon {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          font-weight: 700;
          color: white;
          border-radius: 12px;
          margin-bottom: 12px;
        }

        .card-title {
          font-size: 1.25rem;
          font-weight: 700;
          margin: 0 0 4px;
        }

        .card-subtitle {
          font-size: 0.875rem;
          color: #8b5cf6;
          margin: 0 0 12px;
        }

        .card-description {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.5);
          line-height: 1.5;
          margin: 0;
        }

        /* Value Section */
        .value-section {
          margin-top: 60px;
        }

        .value-grid {
          display: flex;
          justify-content: center;
          gap: 60px;
          flex-wrap: wrap;
        }

        .value-item {
          text-align: center;
        }

        .value-number {
          display: block;
          font-size: 3rem;
          font-weight: 800;
          background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .value-label {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.5);
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        /* Footer */
        .hero-footer {
          margin-top: auto;
          padding-top: 40px;
          display: flex;
          justify-content: center;
        }

        .tech-badge {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 10px 20px;
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.2);
          border-radius: 999px;
          font-size: 0.75rem;
          color: rgba(16, 185, 129, 0.9);
        }

        .status-dot {
          width: 8px;
          height: 8px;
          background: #10b981;
          border-radius: 50%;
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }

        /* Responsive */
        @media (max-width: 768px) {
          .hero-content {
            padding: 24px 16px;
          }

          .hero-title {
            font-size: 2.5rem;
          }

          .hero-subtitle {
            font-size: 1.125rem;
          }

          .cta-group {
            flex-direction: column;
            width: 100%;
          }

          .cta-primary,
          .cta-secondary {
            width: 100%;
            justify-content: center;
          }

          .value-grid {
            gap: 40px;
          }

          .value-number {
            font-size: 2rem;
          }
        }
      `}</style>
    </div>
  );
}
