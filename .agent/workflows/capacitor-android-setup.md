---
description: Scaffolding for Capacitor Android in React/Vite projects
---

## Capacitor Android Setup Scaffolding

Use this workflow to transform your web application into a native Android app using Capacitor.

### 1. Install Capacitor Dependencies
Install the core, CLI, and Android platform packages:
```bash
npm install @capacitor/core
npm install -D @capacitor/cli @capacitor/android
```

### 2. Initialize Capacitor
Run the initialization command. Replace `AppName` and `com.example.app` with your project details:
```bash
npx cap init [AppName] [com.example.app] --web-dir dist
```

### 3. Build your Web App
Capacitor needs a built version of your app to sync:
```bash
npm run build
```

### 4. Add Android Platform
Add the native Android project structure:
```bash
npx cap add android
```

### 5. Update package.json Scripts
Add these scripts to your `package.json` for easier management:
```json
"scripts": {
  "cap:sync": "cap sync",
  "cap:open:android": "cap open android",
  "android:build": "npm run build && cap sync android"
}
```

### 6. Configuration (capacitor.config.ts)
Ensure your `capacitor.config.ts` looks like this for a standard Vite setup:
```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.app',
  appName: 'AppName',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
```

### 7. Run and Sync
Whenever you make web changes, sync them to Android:
```bash
npm run build
npx cap sync
```

To open Android Studio:
```bash
npx cap open android
```
