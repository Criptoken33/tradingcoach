---
description: Scaffolding for Tailwind CSS v4 in React/Vite projects
---

## Tailwind CSS v4 Scaffolding Guide

Use this workflow to quickly set up Tailwind CSS v4 in a React project using Vite and PostCSS.

### 1. Install Dependencies
```bash
npm install -D tailwindcss postcss autoprefixer @tailwindcss/postcss
```

### 2. Configure PostCSS
Create `postcss.config.js` in the project root:
```javascript
export default {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
}
```

### 3. Initialize Tailwind Configuration
Create `tailwind.config.js` in the project root (optional but recommended for custom themes):
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    // Add other paths as needed
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

### 4. Setup Main CSS
Update your `index.css` or `main.css`:
```css
@import "tailwindcss";
/* If using a config file: */
@config "./tailwind.config.js";

/* Your custom styles here */
```

### 5. Import in Entry Point
Ensure your main entry point (e.g., `main.tsx` or `index.tsx`) imports the CSS file:
```typescript
import './index.css';
```

### 6. Cleanup CDN (If applicable)
Remove any Tailwind CDN scripts from `index.html`:
```html
<!-- REMOVE THIS -->
<script src="https://cdn.tailwindcss.com"></script>
```

### 7. Verify Setup
Run the development server and check if Tailwind classes are working:
```bash
npm run dev
```
