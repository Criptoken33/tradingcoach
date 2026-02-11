---
description: Implementación completa de AdMob en aplicaciones híbridas con Capacitor y React
---

Este workflow detalla los pasos para integrar AdMob en una aplicación React con Capacitor, siguiendo los principios de Clean Architecture y las mejores prácticas de monetización.

## Requisitos Previos

1.  Cuenta activa de **Google AdMob**.
2.  Haber creado las aplicaciones (Android/iOS) en el panel de AdMob.
3.  Tener los **App IDs** y los **Ad Unit IDs** a mano.

---

## 1. Instalación de Dependencias

Instala el plugin oficial de AdMob para Capacitor.

```bash
npm install @capacitor-community/admob
npx cap sync
```

---

## 2. Configuración de la Plataforma

### Android (`android/app/src/main/AndroidManifest.xml`)

Añade tu **AdMob App ID** dentro de la etiqueta `<application>`.
*Nota: Usa el ID de prueba de Google `ca-app-pub-3940256099942544~3347511713` para desarrollo.*

```xml
<manifest>
    <application>
        <!-- ... -->
        <meta-data
            android:name="com.google.android.gms.ads.APPLICATION_ID"
            android:value="ca-app-pub-xxxxxxxxxxxxxxxx~yyyyyyyyyy"/>
    </application>
</manifest>
```

### iOS (`ios/App/App/Info.plist`)

Añade las siguientes claves:

```xml
<key>GADApplicationIdentifier</key>
<string>ca-app-pub-xxxxxxxxxxxxxxxx~yyyyyyyyyy</string>
<key>SKAdNetworkItems</key>
<array>
  <dict>
    <key>SKAdNetworkIdentifier</key>
    <string>cstr6suwn9.skadnetwork</string>
  </dict>
  <!-- Añade más redes según necesites -->
</array>
<key>NSUserTrackingUsageDescription</key>
<string>This identifier will be used to deliver personalized ads to you.</string>
```

---

## 3. Implementación del Servicio de AdMob (Architecture Layer)

Crea un servicio dedicado para aislar la lógica de AdMob. Esto evita ensuciar tus componentes de UI.

**Archivo sugerido:** `src/services/adMobService.ts`

```typescript
import { AdMob, AdOptions, AdLoadInfo, InterstitialAdPluginEvents, RewardAdPluginEvents } from '@capacitor-community/admob';
import { isPlatform } from '@ionic/react'; // O tu utilidad de detección de plataforma

export const AdMobService = {
  initialize: async () => {
    if (!isPlatform('hybrid')) return;
    
    try {
      await AdMob.initialize({
        requestTrackingAuthorization: true,
        testingDevices: ['YOUR_TEST_DEVICE_ID'], // Opcional
        initializeForTesting: true, // Poner en false para producción
      });
      console.log('AdMob initialized');
    } catch (error) {
      console.error('AdMob initialization failed', error);
    }
  },

  showBanner: async () => {
    if (!isPlatform('hybrid')) return;
    
    const options: AdOptions = {
      adId: 'ca-app-pub-3940256099942544/6300978111', // TEST ID
      isTesting: true, // Poner en false para producción
      position: 'bottom',
      margin: 0,
    };
    
    try {
      await AdMob.showBanner(options);
    } catch (error) {
      console.error('Error showing banner', error);
    }
  },

  hideBanner: async () => {
    if (!isPlatform('hybrid')) return;
    await AdMob.hideBanner();
  },

  prepareInterstitial: async () => {
    if (!isPlatform('hybrid')) return;
    
    const options: AdOptions = {
      adId: 'ca-app-pub-3940256099942544/1033173712', // TEST ID
      isTesting: true,
    };

    await AdMob.prepareInterstitial(options);
  },

  showInterstitial: async () => {
    if (!isPlatform('hybrid')) return;
    await AdMob.showInterstitial();
  },
  
  prepareRewardVideo: async () => {
      if (!isPlatform('hybrid')) return;
      
      const options: AdOptions = {
        adId: 'ca-app-pub-3940256099942544/5224354917', // TEST ID
        isTesting: true,
      };
      
      await AdMob.prepareRewardVideoAd(options);
  },
  
  showRewardVideo: async (onReward: () => void) => {
       if (!isPlatform('hybrid')) return;
       
       // Listener temporal para la recompensa
       const handler = AdMob.addListener(RewardAdPluginEvents.OnRewarded, (reward) => {
           console.log('User rewarded', reward);
           onReward();
           handler.remove(); // Limpiar listener
       });

       await AdMob.showRewardVideoAd();
  }
};
```

---

## 4. Integración en la UI (Custom Hook)

Crea un hook para manejar el ciclo de vida de los anuncios en tus componentes.

**Archivo sugerido:** `src/hooks/useAds.ts`

```typescript
import { useEffect } from 'react';
import { AdMobService } from '../services/adMobService';

export const useAds = () => {
  useEffect(() => {
    AdMobService.initialize();
  }, []);

  const showBanner = () => AdMobService.showBanner();
  const hideBanner = () => AdMobService.hideBanner();
  // ... exportar otras funciones
  
  return { showBanner, hideBanner, AdMobService };
};
```

---

## 5. Mejores Prácticas y Estrategias de Monetización

1.  **Validación de Consentimiento (GDPR/UMP):** AdMob requiere el consentimiento del usuario en ciertas regiones. El plugin tiene soporte para UMP (User Messaging Platform). Implementa `AdMob.requestConsentInfo()` antes de inicializar.
2.  **No intrusivos:** No muestres intersticiales al abrir la app o salir de ella. Hazlo en pausas naturales (ej: al terminar un nivel o completar una tarea).
3.  **Pre-carga:** Llama a `prepareInterstitial` con antelación, no justo cuando quieres mostrar el anuncio, para evitar tiempos de espera.
4.  **Recompensas Claras:** Usa Clean Architecture para que la lógica de "dar recompensa" (ej: monedas, vidas) esté desacoplada del anuncio. El listener del anuncio solo debe disparar una acción en tu Store/Context.

## 6. Verificación

// turbo
1.  Verifica que el `appId` en `AndroidManifest.xml` sea correcto.
2.  Compila y ejecuta en un dispositivo físico (los emuladores a veces no muestran ads de producción).
3.  Observa los logs para "AdMob initialized" y eventos de carga.

```bash
npx cap open android
```
