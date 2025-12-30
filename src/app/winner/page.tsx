'use client';

import Link from 'next/link';
import { WhereAmI } from '@/components/calculator/WhereAmI';
import { AccuracyCalculator } from '@/components/calculator/PlanningCalculators';

// Default values for game parameters
const DEFAULT_STD_DEV = 80;
const DEFAULT_STAKES = 5.0;

export default function WinnerPage() {
  return (
    <main className="page-main">
      <div className="page-main__inner">
        {/* Header */}
        <header className="page-header">
          <div className="page-header__title-wrapper">
            <h1 className="page-header__title">Am I a Winner?</h1>
            <p className="page-header__subtitle">Analyze your actual results</p>
          </div>
          <div className="header-nav">
            <Link href="/" className="header-nav__link header-nav__link--black">
              Variance Calculator
            </Link>
          </div>
        </header>

        {/* Main Analysis */}
        <section style={{ marginBottom: 'var(--gap)' }}>
          <WhereAmI stdDev={DEFAULT_STD_DEV} stakes={DEFAULT_STAKES} />
        </section>

        {/* Hands Until You Know */}
        <section style={{ marginBottom: 'var(--gap)' }}>
          <div className="grid-12">
            <div className="col-6">
              <AccuracyCalculator stdDev={DEFAULT_STD_DEV} />
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="page-footer">
          Statistical approximations based on the normal distribution. Actual results may vary.
          <br />
          <span className="page-footer__brand">VARIANCE CALCULATOR</span> — Built for poker players
        </footer>
      </div>
    </main>
  );
}
