# Key Features

## 🗺️ Interactive Map Visualization

- **Choropleth Maps**: Color-coded population density across Ukraine's regions
- **Interactive Controls**: Hover and click interactions with detailed region information
- **Real-time Updates**: Dynamic filtering by year and population type
- **Theme Support**: Light/dark mode compatibility

## 📊 Data Visualization

- **Stacked Bar Charts**: Historical population trends (2003-2022)
- **Time Series Charts**: Population projections with confidence intervals
- **Regional Distribution Charts**: Pie charts with gender breakdowns
- **Radial Visualizations**: Demographic breakdowns (Beta)

## 🔍 Advanced Filtering

- **Year Filter**: Select any year from 2003-2022
- **Population Type**: Filter by Urban/Rural/Total population
- **Real-time Sync**: Filter updates propagate across all visualizations
- **City Search**: Look up specific cities with Wikidata integration

## 🔮 Population Prediction System

### Core Capabilities

- **Hybrid Growth Model**: Combines exponential and logistic models for accurate short and long-term projections
- **Multi-factor Analysis**: Incorporates birth rates, death rates, migration, economic conditions, conflict intensity, and family support
- **Dynamic Swing Factors**: 
  - Economic cycles (5.5-year period)
  - Geopolitical impacts
  - International support levels
  - Volatility modeling
- **Shock Event Modeling**: Temporary population impacts with exponential recovery curves
- **Regional Distribution**: Automatic breakdown across all Ukrainian regions with proportional allocation
- **Gender Split Analysis**: Region-specific gender ratio calculations

### Advanced Features

- **Sensitivity Analysis**: Test parameter variations to understand prediction robustness
- **Confidence Intervals**: ±3% uncertainty bounds on predictions
- **Scenario Management**: Save, load, and compare multiple prediction scenarios
- **Policy Response Modeling**: Government intervention impact calculations
- **Regional Feedback Loops**: Inter-regional migration and impact effects

### Visualizations

- **Prediction Charts**: Time series with baseline vs. adjusted trajectories
- **Regional Maps**: Interactive heat maps showing predicted population distribution
- **Sensitivity Panels**: Bar charts showing parameter impact analysis
- **Summary Boxes**: Key metrics and insights at a glance

## 💾 Scenario Management

- **Save Scenarios**: Persist prediction configurations to Firebase
- **Load Scenarios**: Retrieve and apply saved scenarios
- **Compare Scenarios**: Side-by-side comparison of different predictions
- **Local Fallback**: Automatic localStorage backup if Firebase unavailable

## 📱 User Experience

- **Responsive Design**: Optimized for desktop, tablet, and mobile
- **Ukrainian Localization**: Full Ukrainian language interface
- **Accessibility**: ARIA labels and keyboard navigation support
- **Toast Notifications**: User feedback for actions and errors
- **Form Validation**: Real-time input validation with helpful error messages

## 🔧 Technical Features

- **Real-time Data**: Fetches latest population data from external APIs
- **Caching**: Intelligent caching of API responses (24h stale time)
- **Offline Support**: Local storage fallback for scenarios
- **Type Safety**: Full TypeScript coverage for reliability
- **Performance**: Optimized rendering with code splitting and memoization

