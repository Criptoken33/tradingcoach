---
description: Standard React project scaffolding with Vite and path aliases
---

## Standard React Scaffold Guide

Use this workflow to initialize a clean, professional React project structure with basic boilerplate.

### 1. Initialize Project (Vite + React + TS)
If starting from scratch:
```bash
npx -y create-vite@latest ./ --template react-ts
```

### 2. Configure Path Aliases
Update `vite.config.ts` to use the `@` alias for the project root:
```typescript
import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

Update `tsconfig.json` to support the alias:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

### 3. Proposed Folder Structure
```text
src/
├── components/     # UI Components
├── services/       # API and logic services
├── hooks/          # Custom React hooks
├── context/        # React Context providers
├── types/          # TypeScript interfaces/enums
├── utils/          # Helper functions
├── constants/      # Global constants
├── assets/         # Images, fonts, icons
└── App.tsx         # Main container
```

### 4. Boilerplate Components
#### Error Boundary (`src/components/ErrorBoundary.tsx`)
Create a robust Error Boundary to prevent the whole app from crashing:
```typescript
import React, { ErrorInfo } from 'react';

interface State { hasError: boolean; }
class ErrorBoundary extends React.Component<{children: React.ReactNode}, State> {
  state: State = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error(error, info); }
  render() {
    if (this.state.hasError) return <div>Something went wrong.</div>;
    return this.props.children;
  }
}
export default ErrorBoundary;
```

### 5. Essential Hooks (Optional)
Add a safe LocalStorage hook in `src/hooks/useLocalStorage.ts`.

### 6. Verification
Run the dev server:
```bash
npm run dev
```
