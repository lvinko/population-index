# Population Index

An interactive web application for visualizing, analyzing, and predicting population data across regions of Ukraine. The project features dynamic maps, statistical charts, comprehensive demographic information, and an advanced population prediction system with hybrid exponential/logistic modeling.

## 🚀 Features

### Core Features

- **🗺️ Interactive Map Visualization**
  - Real-time population data visualization across Ukraine's regions
  - Choropleth maps with color-coded population density
  - Interactive hover and click interactions with detailed region information
  - Support for light/dark themes

- **📊 Multiple Visualization Types**
  - Stacked bar charts for population trends
  - Radial visualization (Beta) for demographic breakdowns
  - Regional population distribution charts
  - Time series line charts with confidence intervals

- **🔍 Advanced Filtering**
  - Filter by year (2003-2022)
  - Filter by population type (Urban/Rural/Total)
  - Real-time filter updates across all visualizations

- **🔮 Population Prediction System**
  - **Hybrid Growth Model**: Combines exponential and logistic growth models
  - **Dynamic Swing Factors**: Economic cycles, geopolitical impacts, international support
  - **Shock Event Modeling**: Temporary population impacts with recovery curves
  - **Regional Distribution**: Automatic breakdown across all Ukrainian regions
  - **Gender Split Analysis**: Region-specific gender ratio calculations
  - **Sensitivity Analysis**: Parameter variation testing
  - **Confidence Intervals**: ±3% uncertainty bounds
  - **Scenario Management**: Save, load, and compare prediction scenarios
  - **Interactive Visualizations**:
    - Time series charts with baseline and adjusted trajectories
    - Regional pie charts with gender breakdowns
    - Interactive map with population heat mapping
    - Sensitivity analysis bar charts

- **📱 Responsive Design**
  - Optimized for desktop, tablet, and mobile devices
  - Adaptive layouts and touch-friendly interactions

- **🌓 Theme Support**
  - Light and dark mode
  - Automatic theme detection
  - Persistent theme preferences

- **🌐 Localization**
  - Ukrainian language interface
  - Localized number formatting

## 🛠️ Tech Stack

### Core Framework
- **Next.js 15.0** - React framework with App Router
- **React 19.2.0** - UI library
- **TypeScript 5.9.3** - Type safety

### Styling & UI
- **Tailwind CSS 4.1.17** - Utility-first CSS framework
- **DaisyUI 5.5.0** - Component library
- **Geist Font** - Custom typography

### Data Visualization
- **Mapbox GL 3.16.0** - Interactive map rendering
- **Recharts 3.4.1** - Chart library for predictions
- **@visx** - Data visualization primitives

### State Management & Data Fetching
- **@tanstack/react-query 5.90.7** - Server state management
- **React Hook Form 7.53.0** - Form handling
- **Zod 4.1.12** - Schema validation

### Backend & Storage
- **Firebase 12.5.0** - Database and analytics
- **Next.js API Routes** - Server-side endpoints

### Utilities
- **ky 1.14.0** - HTTP client
- **lucide-react 0.553.0** - Icon library
- **react-hot-toast 2.6.0** - Toast notifications

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.0 or higher
- **pnpm** 10.15.0 (recommended) or npm/yarn
- **Mapbox Access Token** (for map functionality)
- **Firebase Project** (for database and analytics)

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd population-index
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   # or
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   # Mapbox Configuration
   NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_access_token

   # Firebase Configuration
   NEXT_PUBLIC_DB_FIREBASE_API_KEY=your_firebase_api_key
   NEXT_PUBLIC_DB_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
   NEXT_PUBLIC_DB_FIREBASE_PROJECT_ID=your_firebase_project_id
   NEXT_PUBLIC_DB_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
   NEXT_PUBLIC_DB_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
   NEXT_PUBLIC_DB_FIREBASE_APP_ID=your_firebase_app_id
   NEXT_PUBLIC_DB_FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id
   ```

4. **Run the development server**
   ```bash
   pnpm dev
   # or
   npm run dev
   # or
   yarn dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🏗️ Building for Production

1. **Build the application**
   ```bash
   pnpm build
   # or
   npm run build
   ```

2. **Start the production server**
   ```bash
   pnpm start
   # or
   npm start
   ```

## 📁 Project Structure

```
population-index/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes
│   │   │   ├── predict/       # Population prediction endpoint
│   │   │   ├── population/    # Population data endpoints
│   │   │   └── scenarios/     # Scenario management
│   │   ├── predict/           # Prediction page
│   │   │   └── components/    # Prediction-specific components
│   │   ├── statistics/        # Statistics page
│   │   └── about/             # About page
│   ├── components/            # Reusable UI components
│   ├── lib/                   # Core business logic
│   │   ├── prediction/        # Prediction algorithms
│   │   │   ├── formula.ts     # Main projection logic
│   │   │   └── modifiers/     # Swing factors, shocks, support
│   │   ├── forecast/          # Regional & gender forecasting
│   │   └── utils/             # Utility functions
│   ├── config/                # Configuration files
│   ├── data/                  # Static data (coefficients, ratios)
│   ├── queries/               # React Query hooks
│   └── types/                 # TypeScript type definitions
├── public/                    # Static assets
└── instructions/              # Documentation
```

## 🔬 Population Prediction System

### Calculation Pipeline

The prediction system uses a sophisticated multi-stage calculation pipeline:

1. **Base Growth Rate Calculation**
   - Weighted log-linear regression on 30 years of historical data
   - Prioritizes recent trends while maintaining long-term patterns

2. **Effective Growth Rate**
   - Adjusts base rate with demographic factors (birth, death, migration)
   - Incorporates economic, conflict, and social support factors
   - Uses nonlinear transformations (tanh) for realistic responses

3. **Carrying Capacity Estimation**
   - Dynamic capacity based on GDP growth, conflict levels, and support
   - Formula: `K = (baseK * econ_effect * support_boost) / conflict_penalty`

4. **Logistic Growth Model**
   - Standard logistic: `P(t) = K / (1 + A * exp(-r*t))`
   - Blends with exponential for short-term predictions (≤5 years)
   - Pure logistic for long-term projections

5. **Dynamic Swing Factors**
   - Economic cycle (9.5-year period, sinusoidal)
   - Geopolitical index effects
   - International support boost
   - Sentiment trends
   - Random volatility

6. **Shock Event Modeling**
   - Temporary population impacts with exponential recovery curves
   - Policy response adjustments based on support level
   - Regional feedback effects

7. **Regional Distribution**
   - Proportional distribution using regional coefficients
   - Gender split using region-specific ratios
   - Confidence intervals scaled from national bounds

### Key Formulas

- **Logistic Growth**: `P(t) = K / (1 + ((K - P0) / P0) * exp(-r*t))`
- **Effective Rate**: `r_eff = r_base + Σ(weight_i * factor_i)`
- **Carrying Capacity**: `K = (P0 * 1.3 * econ_effect * support_boost) / conflict_penalty`
- **Shock Impact**: `modifier = Σ(severity * recovery_curve * 0.04)`

## 🎯 API Routes

### `/api/predict`
- **GET**: Returns latest available year and population data
- **POST**: Generates population prediction with full analysis
  - Request body: `PredictionInput` (baseYear, targetYear, demographic factors, swing inputs)
  - Response: `PredictionResult` (predicted population, time series, regional breakdown, sensitivity analysis)

### `/api/population`
- Returns historical population data for Ukraine

### `/api/scenarios`
- Manages saved prediction scenarios (CRUD operations)

## 🧪 Development

### Available Scripts

- `pnpm dev` - Start development server with Turbopack
- `pnpm build` - Build for production (uses Webpack)
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

### Code Style

- TypeScript strict mode enabled
- ESLint configuration for Next.js
- Component-based architecture
- Custom hooks for data fetching

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is private and proprietary.

## 🙏 Acknowledgments

- Population data sources
- Mapbox for mapping services
- Firebase for backend infrastructure
- All contributors and maintainers

---

Built with ❤️ using Next.js and TypeScript
