# Architecture Overview

## System Architecture

This application follows a **modern full-stack Next.js architecture** with a clear separation between client-side UI, server-side API routes, and external data sources.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Layer                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   React UI   │  │ React Query  │  │   Context    │       │
│  │ Components   │  │   (State)    │  │  Providers   │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Next.js App Router                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  API Routes  │  │   Pages      │  │  Middleware  │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Business Logic Layer                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  Prediction  │  │   Forecast   │  │   Utils      │       │
│  │   Formulas   │  │   Regional   │  │   Helpers    │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Firebase   │  │  External    │  │   Static     │       │
│  │  Firestore   │  │     APIs     │  │    JSON      │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Core Framework
- **Next.js 16.0.1** - React framework with App Router
- **React 19.2.0** - UI library
- **TypeScript 5.9.3** - Type safety and developer experience

### State Management
- **@tanstack/react-query 5.90.7** - Server state management, caching, and data synchronization
- **React Context API** - Client-side state (MapFilterContext)

### Data Layer
- **Firebase 12.5.0** - Firestore database for scenario persistence, Analytics
- **ky 1.14.0** - HTTP client for API requests
- **External APIs** - CountriesNow API for population data

### UI & Visualization
- **Tailwind CSS 4.1.17** - Utility-first CSS framework
- **DaisyUI 5.5.0** - Component library
- **Mapbox GL 3.16.0** - Interactive map rendering
- **Recharts 3.4.1** - Chart library
- **@visx** - Low-level visualization primitives

### Form & Validation
- **React Hook Form 7.53.0** - Form state management
- **Zod 4.1.12** - Schema validation

### Utilities
- **lucide-react** - Icon library
- **react-hot-toast** - Toast notifications

## Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes (Server-side)
│   │   ├── predict/              # Population prediction endpoint
│   │   ├── population/           # Population data endpoints
│   │   ├── populationByYear/    # Year-specific population queries
│   │   ├── scenarios/           # Scenario CRUD operations
│   │   └── city/                # City data endpoints
│   ├── predict/                 # Prediction page
│   │   └── components/          # Prediction-specific components
│   ├── statistics/              # Statistics visualization page
│   ├── about/                   # About page
│   ├── layout.tsx               # Root layout with providers
│   └── page.tsx                 # Landing page
│
├── components/                   # Reusable UI components
│   ├── Map.tsx                  # Mapbox map component
│   ├── MapFilter.tsx            # Filter controls
│   ├── PopulationStackedChart.tsx
│   ├── StatePopulationPanel.tsx
│   └── ...
│
├── container/                    # Page-level containers
│   ├── Landing.tsx              # Main landing page container
│   └── StatChart.tsx            # Statistics page container
│
├── context/                      # React Context providers
│   └── MapFilterContext.tsx     # Map filter state management
│
├── lib/                          # Core business logic
│   ├── prediction/              # Population prediction algorithms
│   │   ├── formula.ts           # Main projection logic
│   │   ├── scenarios.ts         # Scenario management
│   │   ├── policyResponses.ts   # Policy impact calculations
│   │   ├── regionalFeedback.ts  # Regional feedback loops
│   │   └── modifiers/           # Prediction modifiers
│   │       ├── swingFactors.ts  # Economic/geopolitical factors
│   │       ├── shocks.ts        # Shock event modeling
│   │       └── support.ts       # International support effects
│   ├── forecast/                # Forecasting utilities
│   │   ├── regionalDistribution.ts
│   │   └── genderSplit.ts
│   ├── api/                     # External API clients
│   │   ├── fetchCountryData.ts
│   │   └── fetchExternalFactors.ts
│   └── utils/                   # Utility functions
│       ├── formula.ts
│       └── types.ts
│
├── config/                       # Configuration
│   ├── apiClient/               # React Query setup
│   ├── dbClient/                # Firebase configuration
│   ├── map/                     # Mapbox configuration
│   │   ├── constants.ts
│   │   ├── handlers.ts
│   │   ├── layers.ts
│   │   └── regions.ts
│   ├── metadata.ts              # SEO metadata
│   └── navigation.ts            # Navigation config
│
├── queries/                      # React Query hooks
│   ├── city.ts
│   ├── countriesNow.ts
│   └── index.tsx
│
├── services/                     # Service layer
│   └── scenarioRepository.ts    # Firestore operations
│
├── data/                         # Static data files
│   ├── genderRatios.json
│   └── regionalCoefficients.json
│
└── types/                        # TypeScript type definitions
    ├── population.ts
    └── wikidata.ts
```

## Key Architectural Patterns

### 1. Server-Side API Routes
API routes in `src/app/api/` handle:
- **Data validation** using Zod schemas
- **Business logic orchestration**
- **External API integration**
- **Error handling and response formatting**

Example: `/api/predict` route validates input, fetches historical data, runs prediction algorithms, and returns structured results.

### 2. Client-Side Data Fetching
- **React Query** manages server state with:
  - Automatic caching (24h stale time)
  - Background refetching
  - Optimistic updates
  - Error handling

### 3. State Management Strategy
- **Server State**: React Query (population data, scenarios)
- **Client State**: React Context (map filters, UI state)
- **Form State**: React Hook Form (prediction forms)

### 4. Business Logic Separation
Core algorithms are isolated in `src/lib/`:
- **Pure functions** for calculations
- **Modular modifiers** for different impact factors
- **Type-safe interfaces** for data flow

### 5. Component Architecture
- **Presentational Components**: `src/components/` (reusable UI)
- **Container Components**: `src/container/` (page-level logic)
- **Feature Components**: `src/app/predict/components/` (feature-specific)

## Data Flow

### Population Prediction Flow

```
1. User Input (PredictionForm)
   │
   ▼
2. POST /api/predict
   │
   ├─► Validate input (Zod)
   │
   ├─► Fetch historical data (fetchUkrainePopulation)
   │
   ├─► Calculate base growth rate (formula.ts)
   │
   ├─► Apply modifiers:
   │   ├─► Swing factors (economic, geopolitical)
   │   ├─► Shock events
   │   ├─► Support effects
   │   └─► Policy responses
   │
   ├─► Project population (hybrid exponential/logistic)
   │
   ├─► Calculate regional distribution
   │
   ├─► Calculate gender split
   │
   └─► Return PredictionResult
       │
       ▼
3. Update UI (React Query cache)
   │
   ▼
4. Render visualizations (Charts, Maps)
```

### Scenario Management Flow

```
1. User saves scenario
   │
   ▼
2. POST /api/scenarios
   │
   ├─► Validate scenario data
   │
   ├─► Save to Firestore (scenarioRepository)
   │
   └─► Return updated list
       │
       ▼
3. Update React Query cache
   │
   ▼
4. Sync with localStorage (fallback)
```

## Core Algorithms

### Population Prediction Formula

The prediction system uses a **hybrid exponential/logistic growth model**:

1. **Base Growth Rate**: Weighted log-linear regression on 30 years of historical data
2. **Effective Rate**: Base rate adjusted by demographic factors (birth, death, migration)
3. **Carrying Capacity**: Dynamic capacity based on economic conditions, conflict, and support
4. **Projection**: 
   - Short-term (≤5 years): Blended exponential/logistic
   - Long-term (>5 years): Pure logistic growth
5. **Modifiers**: Applied sequentially:
   - Swing factors (economic cycles, geopolitical index)
   - Shock events (temporary impacts with recovery)
   - Support effects (international aid impact)
   - Policy responses (government intervention)

### Regional Distribution

- Uses regional coefficients from static JSON data
- Proportional distribution based on historical patterns
- Gender split using region-specific ratios
- Confidence intervals scaled from national bounds

## External Dependencies

### APIs
- **CountriesNow API**: Population data for Ukraine (historical and current)
- **Mapbox API**: Map tiles and geocoding
- **Wikidata API**: City information and metadata

### Services
- **Firebase Firestore**: Scenario persistence
- **Firebase Analytics**: Usage tracking

## Configuration Management

Environment variables (`.env.local`):
- `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` - Mapbox API key
- `NEXT_PUBLIC_DB_FIREBASE_*` - Firebase configuration

Configuration is centralized in `src/config/index.tsx` and accessed through a single config object.

## Build & Deployment

### Development
- Uses **Turbopack** for fast development builds
- Hot module replacement enabled
- TypeScript strict mode

### Production
- Uses **Webpack** for production builds (better optimization)
- Static optimization for pages
- API routes run as serverless functions

## Performance Considerations

1. **Data Caching**: React Query caches API responses (24h stale time)
2. **Code Splitting**: Next.js automatic code splitting by route
3. **Static Assets**: Optimized images and fonts
4. **Lazy Loading**: Map components loaded on demand
5. **Memoization**: React.memo and useMemo for expensive calculations

## Security

1. **Input Validation**: Zod schemas validate all API inputs
2. **Environment Variables**: Sensitive keys only in server-side code
3. **CORS**: API routes handle CORS appropriately
4. **Type Safety**: TypeScript prevents common runtime errors

## Testing Strategy

(Not currently implemented, but recommended)
- Unit tests for prediction algorithms
- Integration tests for API routes
- E2E tests for critical user flows

## Future Considerations

- **Caching Strategy**: Consider Redis for API response caching
- **Database**: Migration path if Firestore becomes limiting
- **Monitoring**: Add error tracking (Sentry, etc.)
- **Performance**: Consider CDN for static assets
- **Internationalization**: i18n support for multiple languages

