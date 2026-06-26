# Sistem Penggajian & Financial Recapitulation App

A modern, desktop-like web application designed for financial data import, dashboards, and automated tax reporting. Powered by the Gemini AI API, it provides intelligent insights alongside robust payroll and financial tracking capabilities.

## 🌟 Features

- **Dashboard & Analytics:** Interactive charts and visualizations built with `recharts`.
- **Excel Data Management:** Import, export, and manage spreadsheet data easily using `xlsx`.
- **Automated Reporting:** Generate comprehensive tax and financial reports in PDF format with `jspdf`.
- **AI Integration:** Seamlessly integrated with Google's Gemini API for advanced capabilities, such as automated server-side intelligence and data recapitulation.
- **Modern UI:** Built with React, Tailwind CSS, Framer Motion, and `lucide-react` for a premium, responsive, and intuitive user interface.

## 🚀 Tech Stack

- **Frontend:** React 19, Tailwind CSS v4, Framer Motion, Vite
- **Backend:** Express, Node.js, TSX
- **Language:** TypeScript
- **AI Engine:** Google Gemini API (`@google/genai`)
- **Utilities:** date-fns, clsx, tailwind-merge

## 🛠️ Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- `npm` or `yarn`

### Installation

1. **Navigate to the Project Directory:**
   Make sure you are inside the `SIstem-Penggajian-main` directory.

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   Copy the example environment file and add your Gemini API Key.
   ```bash
   cp .env.example .env.local
   ```
   Open `.env.local` and set your `GEMINI_API_KEY`:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

### Running the App Locally

To start both the Vite development server and the Express backend:

```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or the port specified by Vite).

### Building for Production

To create a production build of the frontend and bundle the backend server:

```bash
npm run build
```

To start the production server:

```bash
npm run start
```

## 📁 Project Structure

- `src/` - Contains the React frontend components, styles, and types.
  - `components/` - Reusable UI components.
  - `lib/` - Utility functions and helpers.
  - `App.tsx` - Main application component.
- `server.ts` - Express server and Gemini API backend integration.
- `public/` - Static assets.

## 📄 License

This project is free to use.
