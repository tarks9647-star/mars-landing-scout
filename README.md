# Mars Landing Scout

Build a complete, production-ready React (Vite) application from scratch for Martian landing reconnaissance. 

Core Features & Architecture:

1. Maps & Assets (Vercel-Safe): Display the exact uploaded NASA Mars raster and rock maps natively in full resolution. Import all images cleanly via standard ES modules or store them in the `public/` directory with relative paths so there are zero broken images or build/routing errors when deploying to Vercel. Ensure clean TypeScript/JSX types and zero unused imports for a clean Vercel production build.

2. Interactive Map Inspection: Implement free click-to-select point inspection anywhere on the map coordinates with visual target crosshairs and live coordinate tracking.

3. Live Telemetry Dashboard: Build an animated telemetry dashboard featuring real-time interactive charts (using Recharts) that compute safety scores, risk percentages, rock/mineral composition, water ice proximity, and surface temperature metrics for the selected landing site.

4. Header Controls (Guide & Bilingual Support): Add two sleek buttons in the top header:

   - A compact "Guide / Info" button that opens a clean aerospace modal explaining what the app offers, its key features, and step-by-step usage instructions.

   - A bilingual (AR / EN) toggle button that translates the UI and the Guide modal between Arabic (with proper RTL layout) and English.

Ensure a futuristic aerospace UI with smooth animations and clean component architecture.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://mars-landing-scout.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/296f0522-59a4-4627-ac0c-90c19628e11a).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
