# VILO TV Web Application

A modern web application for streaming IPTV channels with a beautiful interface built using Next.js 15.

## Features

- 🎯 **Category-based Navigation**: Browse channels by Movies, Sports, News, Music, Kids, and more
- 🌍 **Country Selection**: Find channels from over 50 countries worldwide
- 🗣️ **Language Support**: Filter content by language preferences
- 🎥 **HLS Video Player**: High-quality streaming with HLS.js integration
- 📱 **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- 🎨 **Beautiful UI**: Modern gradient design with smooth animations
- ⚡ **Fast Performance**: Optimized with Next.js 15 and React 19

## Technology Stack

- **Framework**: Next.js 15.1.0 with App Router
- **Frontend**: React 19.0.0, TypeScript
- **Styling**: Tailwind CSS 3.4.1 with custom animations
- **Video Player**: HLS.js 1.5.15 for streaming
- **Icons**: Heroicons 2.1.4
- **Deployment**: Vercel-optimized

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
   \`\`\`bash
   git clone <your-repo-url>
   cd vilo-tv-web
   \`\`\`

2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Run the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment to Vercel

### Quick Deploy

1. **Connect to Vercel:**

   - Visit [vercel.com](https://vercel.com)
   - Sign up/login with GitHub
   - Click "New Project"
   - Import your repository

2. **Configure Project:**

   - Framework Preset: **Next.js**
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `.next`

3. **Deploy:**
   - Click "Deploy"
   - Your app will be live in minutes!

### Manual Deploy via CLI

1. Install Vercel CLI:
   \`\`\`bash
   npm i -g vercel
   \`\`\`

2. Deploy:
   \`\`\`bash
   vercel --prod
   \`\`\`

## Project Structure

\`\`\`
src/
├── app/
│ ├── api/
│ │ ├── categories/
│ │ ├── countries/
│ │ └── languages/
│ ├── categories/
│ ├── countries/
│ ├── languages/
│ └── page.tsx
├── components/
│ └── VideoPlayer.tsx
├── lib/
│ └── types.ts
└── styles/
└── globals.css
\`\`\`

## API Endpoints

- `/api/categories` - List all available categories
- `/api/categories/[categoryId]` - Get channels for a specific category
- `/api/countries` - List all countries with channel counts
- `/api/countries/[countryCode]` - Get channels for a specific country
- `/api/languages` - List all languages with channel counts
- `/api/languages/[languageCode]` - Get channels for a specific language

## Environment Variables

No environment variables are required for basic functionality. The app uses mock data for development and can be configured to fetch from IPTV APIs in production.

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Adding Real Streams

To add real IPTV streams, modify the mock data in:

- `src/app/api/categories/[categoryId]/route.ts`
- `src/app/api/countries/[countryCode]/route.ts`
- `src/app/api/languages/[languageCode]/route.ts`

## Features Overview

### 🏠 Landing Page

Beautiful three-card layout for navigation:

- Categories (Movies, Sports, News, etc.)
- Countries (50+ countries)
- Languages (Multiple language support)

### 📺 Video Player

- HLS.js integration for smooth streaming
- Modal interface with controls
- Error handling and recovery
- Support for multiple video formats

### 🎨 Design

- Gradient backgrounds with animations
- Responsive grid layouts
- Hover effects and transitions
- Loading states and error pages

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please open an issue in the repository or contact the development team.

---

Built with ❤️ using Next.js 15 and React 19
