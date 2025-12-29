# Poker Variance Calculator

A production-quality, client-side poker variance calculator for cash games. Visualize how variance affects your results with sample paths, confidence intervals, and downswing analysis.

## Features

- **Sample Path Visualization**: 20 simulated outcomes with EV line and 70%/95% confidence intervals
- **Detailed Run Analysis**: Single high-resolution path with drawdown tracking and zoom slider
- **Variance Summary Table**: Metrics at key milestones (10k, 50k, 100k, 250k, 500k, 1M hands)
- **Downswing Analysis**: Probability and expected count of downswings from large simulation
- **Key Results Panel**: Expected winnings, confidence intervals, probability of loss, bankroll requirements
- **Game Presets**: Quick-fill for NLH and PLO standard deviations
- **Shareable URLs**: All inputs serialized to URL query params
- **CSV Export**: Download sample paths and detailed run data
- **Unit Toggle**: View results in BB or $ (enter big blind size)
- **Reproducible Results**: Optional random seed for consistent simulations
- **Fast/Accurate Modes**: Trade-off between speed and precision

## Getting Started

### Prerequisites

- Node.js 18+
- npm (or yarn/pnpm)

### Installation

```bash
# Navigate to project directory
cd variance-calculator

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
```

This generates a static export in the `out/` directory, ready for deployment to any static hosting service.

### Run Tests

```bash
# Run tests in watch mode
npm test

# Run tests once
npm run test:run
```

## Usage

1. **Select a preset** or enter custom values:
   - Winrate (BB/100): Your expected win rate
   - Std Dev (BB/100): Standard deviation (65-120 typical)
   - Hands: Number of hands to simulate

2. **Optional inputs**:
   - Observed Winrate: Your actual observed rate (to calculate "running hot/cold" probability)
   - Random Seed: For reproducible results
   - Big Blind Size: To convert BB to dollars

3. **Click Calculate** to run the simulation

4. **Explore results**:
   - Sample paths chart shows possible outcomes
   - Detailed run chart lets you zoom into a single simulation
   - Tables show variance at milestones and downswing statistics

## Technical Details

### Architecture

- **Next.js 14** with App Router for modern React patterns
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Recharts** for responsive, interactive charts
- **Web Workers** for non-blocking simulation computation
- **Vitest** for unit testing

### Math Implementation

The calculator uses normal distribution approximations:

- **Expected Value**: `EV = winrate * (hands / 100)`
- **Standard Deviation**: `SD = stddev * sqrt(hands / 100)`
- **Confidence Intervals**: `CI = EV +/- z * SD`
  - 70% CI: z = 1.036
  - 95% CI: z = 1.960
- **Probability of Loss**: `P(loss) = normalCDF(-EV / SD)`
- **Risk of Ruin**: Brownian motion approximation `RoR = exp(-2 * mu * BR / sigma^2)`

Simulation uses:
- Mulberry32 seeded PRNG for reproducibility
- Box-Muller transform for normal random variates
- 100-hand blocks (accurate) or 500-hand blocks (fast)

### Project Structure

```
src/
├── app/
│   ├── layout.tsx      # Root layout
│   ├── page.tsx        # Main calculator page
│   └── globals.css     # Global styles
├── components/
│   ├── ui/             # Reusable UI primitives
│   ├── InputForm.tsx   # Parameter inputs
│   ├── KeyResults.tsx  # Sticky results summary
│   ├── SamplePathsChart.tsx
│   ├── DetailedRunChart.tsx
│   ├── VarianceSummary.tsx
│   ├── DownswingTables.tsx
│   └── ExportButtons.tsx
├── hooks/
│   ├── useSimulation.ts    # Worker communication
│   ├── useDebounce.ts      # Input debouncing
│   └── useUrlState.ts      # URL sync
├── lib/
│   ├── math/
│   │   ├── statistics.ts   # Normal CDF, CI calculations
│   │   ├── simulation.ts   # Monte Carlo simulation
│   │   ├── analytics.ts    # Metric calculations
│   │   └── statistics.test.ts
│   ├── types.ts            # TypeScript interfaces
│   ├── constants.ts        # Presets, validation
│   └── utils.ts            # Formatters, helpers
└── workers/
    └── simulation.worker.ts
```

## License

MIT

## Acknowledgments

Inspired by [Primedope's Variance Calculator](https://www.primedope.com/poker-variance-calculator/) with enhanced UX features.
