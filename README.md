# ViteLens 🔍

A modern, interactive healthcare data analysis and visualization platform built with React, Vite, and Tailwind CSS.

Live url of the app:- https://healthcareeda.netlify.app/

## Overview

ViteLens is a comprehensive data analysis tool designed for exploring, cleaning, and deriving insights from healthcare datasets. With an intuitive step-by-step workflow, users can upload patient data, validate its quality, perform exploratory data analysis, and uncover meaningful correlations and insights.

## Features

✨ **Multi-step Workflow**
- **Load Data**: Import CSV files with flexible column mapping
- **Clean Data**: Validate, deduplicate, and profile data quality
- **Explore**: Perform univariate and bivariate analysis with interactive visualizations
- **Correlations**: Inspect numeric feature relationships through heatmaps
- **Insights**: Automatically extract key factors and statistical findings

📊 **Interactive Visualizations**
- Bar charts for categorical analysis
- Histograms for distribution analysis
- Scatter plots for relationship analysis
- Correlation heatmaps for feature dependencies

🔧 **Data Quality Tools**
- Detect duplicate records
- Identify missing values
- Calculate data completeness metrics
- Profile dataset characteristics

📈 **Statistical Analysis**
- Correlation matrix computation
- Feature relationship analysis
- Automatic insight generation
- Data filtering and search capabilities

## Tech Stack

- **Frontend Framework**: React 19.2.3
- **Build Tool**: Vite 7.3.2
- **Styling**: Tailwind CSS 4.1.17
- **Language**: TypeScript 5.9.3
- **Icons**: Lucide React 0.575.0
- **Utilities**: clsx, tailwind-merge

## Getting Started

### Prerequisites

- Node.js 16+ and npm/yarn installed
- A modern web browser

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/ViteLens.git
cd ViteLens

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Building for Production

```bash
# Create optimized production build
npm run build

# Preview production build locally
npm run preview
```

The build output generates both a standard bundled version and a single-file HTML (`dist/index.html`) for easy deployment.

## Project Structure

```
ViteLens/
├── src/
│   ├── components/          # React components
│   │   ├── charts/         # Chart visualizations
│   │   ├── CleaningSummary.tsx
│   │   ├── DataTable.tsx
│   │   ├── FileUpload.tsx
│   │   ├── FilterPanel.tsx
│   │   ├── HealthForm.tsx
│   │   └── HealthReport.tsx
│   ├── pages/              # Page components for each step
│   │   ├── UploadPage.tsx
│   │   ├── CleanPage.tsx
│   │   ├── ExplorePage.tsx
│   │   ├── CorrelationPage.tsx
│   │   └── InsightsPage.tsx
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utility functions
│   │   ├── dataCleaner.ts
│   │   ├── eda.ts
│   │   ├── featureEngineering.ts
│   │   ├── healthAnalyzer.ts
│   │   └── cn.ts
│   ├── App.tsx            # Main app component
│   ├── main.tsx           # Entry point
│   └── index.css          # Global styles
├── public/                 # Static assets
├── index.html             # HTML template
├── package.json           # Project dependencies
├── tsconfig.json          # TypeScript configuration
├── vite.config.ts         # Vite configuration
└── postcss.config.cjs     # PostCSS configuration

```

## Usage

1. **Upload Data**: Start by uploading a CSV file using the file upload interface. Map columns to data fields.
2. **Clean Data**: Review data quality metrics and apply cleaning operations.
3. **Explore**: Analyze individual variables and their distributions.
4. **Analyze Correlations**: Examine relationships between numeric features.
5. **Generate Insights**: View automatic insights and statistical summaries.

### Sample Data

A sample healthcare dataset (`sample-healthcare-data.csv`) is included in the `public/` folder for testing.

## Contributing

Contributions are welcome! Feel free to submit issues and pull requests.

## License

This project is licensed under the MIT License.

## Support

For issues, questions, or suggestions, please open an issue on GitHub.

---

**Built with ❤️ using React, Vite, and Tailwind CSS**
