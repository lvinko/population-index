# Population Index

An interactive web application for visualizing, analyzing, and predicting population data across regions of Ukraine. The project features dynamic maps, statistical charts, comprehensive demographic information, and an advanced population prediction system with hybrid exponential/logistic modeling.

## 📚 Documentation

- **[FEATURES.md](./FEATURES.md)** - Comprehensive overview of all features
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Technical architecture and system design

## 🚀 Quick Overview

- **🗺️ Interactive Maps** - Real-time population visualization with choropleth maps
- **📊 Data Visualization** - Multiple chart types including time series, bar charts, and regional distributions
- **🔮 Population Prediction** - Advanced hybrid growth model with sensitivity analysis and scenario management
- **🔍 Advanced Filtering** - Filter by year, population type, and region
- **💾 Scenario Management** - Save, load, and compare prediction scenarios
- **📱 Responsive Design** - Optimized for all devices with light/dark theme support

For detailed feature descriptions, see [FEATURES.md](./FEATURES.md).

## 🛠️ Tech Stack

**Core:** Next.js 16, React 19, TypeScript 5.9  
**UI:** Tailwind CSS 4, DaisyUI 5, Mapbox GL 3  
**Data:** React Query 5, Firebase 12, Zod 4  
**Visualization:** Recharts 3, @visx  
**Forms:** React Hook Form 7

For detailed architecture information, see [ARCHITECTURE.md](./ARCHITECTURE.md).

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
src/
├── app/              # Next.js App Router (pages & API routes)
├── components/       # Reusable UI components
├── lib/              # Core business logic (prediction algorithms)
├── config/           # Configuration files
├── data/             # Static data files
├── queries/          # React Query hooks
└── types/            # TypeScript definitions
```

For detailed project structure and architecture, see [ARCHITECTURE.md](./ARCHITECTURE.md).

## 🔬 Population Prediction System

The prediction system uses a sophisticated **hybrid exponential/logistic growth model** with:

- Multi-factor analysis (demographics, economics, conflict, support)
- Dynamic swing factors and shock event modeling
- Regional distribution with gender split analysis
- Sensitivity analysis and confidence intervals

For detailed algorithm information and formulas, see [ARCHITECTURE.md](./ARCHITECTURE.md#core-algorithms).

## 🎯 API Routes

- **`/api/predict`** - Population prediction (GET/POST)
- **`/api/population`** - Historical population data
- **`/api/populationByYear`** - Year-specific population queries
- **`/api/scenarios`** - Scenario management (CRUD)
- **`/api/city`** - City data endpoints

For detailed API documentation and data flow, see [ARCHITECTURE.md](./ARCHITECTURE.md#data-flow).

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
