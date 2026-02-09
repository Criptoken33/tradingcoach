---
description: Scaffolding for AdMob Integration in Capacitor projects
---

## AdMob Integration Scaffolding

Use this workflow to implement Google AdMob monetization in your Capacitor/Android project.

### 1. Install AdMob Plugin
Install the community-maintained AdMob plugin:
```bash
npm install @capacitor-community/admob
npx cap sync
```

### 2. Configure Android Manifest
Add your AdMob Application ID to `android/app/src/main/AndroidManifest.xml` inside the `<application>` tag:

```xml
<meta-data
    android:name="com.google.android.gms.ads.APPLICATION_ID"
    android:value="ca-app-pub-3940256099942544~3347511713"/> <!-- Test ID -->
```

### 3. Create AdMob Service
Create `services/admobService.ts` to manage ad logic:

```typescript
import { AdMob, BannerAdOptions, BannerAdPosition, BannerAdSize } from '@capacitor-community/admob';

export const initAdMob = async () => {
    try {
        await AdMob.initialize({});
        console.log('AdMob Initialized');
    } catch (error) {
        console.error('Error initializing AdMob:', error);
    }
};

export const showBanner = async (adId: string = 'ca-app-pub-3940256099942544/6300978111') => {
    const options: BannerAdOptions = {
        adId: adId, // Default is Test Unit ID
        adSize: BannerAdSize.ADAPTIVE_BANNER,
        position: BannerAdPosition.BOTTOM_CENTER,
        margin: 0,
        isTesting: true,
    };

    try {
        await AdMob.showBanner(options);
    } catch (error) {
        console.error('Error showing banner:', error);
    }
};

export const hideBanner = async () => {
    try {
        await AdMob.hideBanner();
    } catch (error) {
        console.error('Error hiding banner:', error);
    }
};
```

### 4. Initialize in App.tsx
Call the initialization and show ads in your main component:

```typescript
import { useEffect } from 'react';
import { initAdMob, showBanner } from './services/admobService';

// Inside your App component
useEffect(() => {
    const startAds = async () => {
        await initAdMob();
        await showBanner();
    };
    startAds();
}, []);
```

### 5. Deployment Checklist
- Replace Test IDs with Production IDs in `AndroidManifest.xml` and `admobService.ts`.
- Set `isTesting: false` in production.
- Ensure `npx cap sync` is run after plugin installation.
