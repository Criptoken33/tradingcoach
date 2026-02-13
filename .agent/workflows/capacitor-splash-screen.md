---
description: Implementación profesional de Splash Screen animado con Capacitor + React (sin parpadeos blancos)
---

# Splash Screen Profesional — Capacitor + React

Implementación de un splash screen nativo con transición fluida a un splash animado en React.
Cubre las **5 capas** que deben tener el mismo background color para evitar parpadeos blancos.

---

## Arquitectura de Capas (Anti-Flicker)

El secreto para cero parpadeos es que **todas estas capas** tengan el mismo color de fondo:

```
┌─────────────────────────────────────────┐
│  1. Android Window Background           │  ← styles.xml
│  ┌───────────────────────────────────┐  │
│  │  2. Android 12+ Splash Screen     │  │  ← splash.xml + colors.xml
│  │  ┌─────────────────────────────┐  │  │
│  │  │  3. Capacitor WebView BG     │  │  │  ← capacitor.config.ts (top-level)
│  │  │  ┌───────────────────────┐  │  │  │
│  │  │  │  4. HTML <body> inline  │  │  │  │  ← index.html
│  │  │  │  ┌─────────────────┐  │  │  │  │
│  │  │  │  │ 5. React Splash  │  │  │  │  │  ← AnimatedSplash.tsx
│  │  │  │  └─────────────────┘  │  │  │  │
│  │  │  └───────────────────────┘  │  │  │
│  │  └─────────────────────────────┘  │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

---

## Prerequisitos

- Proyecto React + Vite + Capacitor ya inicializado
- Android platform añadida (`npx cap add android`)
- Icono de la app disponible como PNG (ej. `icon.png`)

---

## Paso 1: Instalar el plugin SplashScreen

```bash
npm install @capacitor/splash-screen --legacy-peer-deps
npx cap sync
```

> **Nota:** Usar `--legacy-peer-deps` si hay conflictos con `@codetrix-studio/capacitor-google-auth` u otros plugins.

---

## Paso 2: Definir el color del splash

Elegir un color principal de marca. En este ejemplo: `#388656`.

### 2.1 — `android/app/src/main/res/values/colors.xml`

Asegurar que exista el color del splash:

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="colorPrimary">#388656</color>
    <color name="colorPrimaryDark">#388656</color>
    <color name="colorAccent">#388656</color>
    <color name="splash_background">#388656</color>
</resources>
```

---

## Paso 3: Configurar el Splash Nativo (Android XML)

### 3.1 — `android/app/src/main/res/drawable/splash.xml`

```xml
<?xml version="1.0" encoding="utf-8"?>
<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
    <item android:drawable="@color/splash_background"/>
    <item
        android:drawable="@mipmap/ic_launcher"
        android:gravity="center"
        android:width="200dp"
        android:height="200dp"/>
</layer-list>
```

> **Importante:** Usar `@mipmap/ic_launcher` (el icono de la app) centrado sobre el fondo de color. Ajustar `width/height` al tamaño deseado.

### 3.2 — `android/app/src/main/res/values/styles.xml`

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="AppTheme" parent="Theme.AppCompat.Light.DarkActionBar">
        <item name="colorPrimary">@color/colorPrimary</item>
        <item name="colorPrimaryDark">@color/colorPrimaryDark</item>
        <item name="colorAccent">@color/colorAccent</item>
    </style>

    <!-- CAPA 1: Window background = color del splash -->
    <style name="AppTheme.NoActionBar" parent="Theme.AppCompat.DayNight.NoActionBar">
        <item name="windowActionBar">false</item>
        <item name="windowNoTitle">true</item>
        <item name="android:background">@color/splash_background</item>
    </style>

    <!-- CAPA 2: Android 12+ Splash Screen API -->
    <style name="AppTheme.NoActionBarLaunch" parent="Theme.SplashScreen">
        <item name="windowSplashScreenBackground">@color/splash_background</item>
        <item name="windowSplashScreenAnimatedIcon">@mipmap/ic_launcher</item>
        <item name="windowSplashScreenAnimationDuration">300</item>
        <item name="postSplashScreenTheme">@style/AppTheme.NoActionBar</item>
        <item name="android:windowBackground">@drawable/splash</item>
    </style>
</resources>
```

> **Clave:** `android:background` en `AppTheme.NoActionBar` DEBE ser `@color/splash_background`, **NO** `@null`. Esto evita que la ventana detrás del WebView sea blanca.

---

## Paso 4: Configurar Capacitor (CAPA 3 — WebView)

### `capacitor.config.ts`

```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.app',
  appName: 'MiApp',
  webDir: 'dist',
  
  // ⚠️ CAPA 3 — CRÍTICO: Color de fondo del WebView nativo
  // Esto es lo que el usuario ve ANTES de que el HTML cargue.
  // Sin esto, el WebView muestra BLANCO durante ~500-1000ms.
  backgroundColor: '#388656',
  
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,        // No usar timer, control manual
      launchAutoHide: false,        // NO ocultar automáticamente
      backgroundColor: "#388656",   // Color del overlay del splash
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
};

export default config;
```

> **⚠️ IMPORTANTE:** El `backgroundColor` **top-level** y el de `plugins.SplashScreen` son **DIFERENTES**:
> - **Top-level:** Color del WebView nativo de Android (la pieza más importante)
> - **Plugin:** Color del overlay del splash nativo de Capacitor

---

## Paso 5: Fondo inline en HTML (CAPA 4)

### `index.html`

```html
<!-- CAPA 4: Inline style en body para que el primer frame del HTML sea verde -->
<body style="background-color: #388656;" class="...tus-clases-normales...">
  <div id="root"></div>
  <script type="module" src="/index.tsx"></script>
</body>
```

> **¿Por qué inline?** Porque el CSS externo (`index.css`) tarda en cargar. El inline style se aplica desde el primer frame del HTML.

---

## Paso 6: Fondo en CSS global (respaldo)

### `index.css`

```css
html,
body {
  background-color: #388656; /* Coincide con el Splash */
  /* ...otros estilos... */
}
```

---

## Paso 7: Componente React AnimatedSplash (CAPA 5)

### `src/components/Splash/AnimatedSplash.tsx`

```tsx
import { useState, useEffect } from 'react';

const AnimatedSplash = () => {
    const [textVisible, setTextVisible] = useState(false);

    useEffect(() => {
        // Pequeño delay para que el componente monte antes de animar
        const timer = setTimeout(() => setTextVisible(true), 100);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#388656]">
            <h1 
                className={`text-5xl font-bold text-white tracking-widest transform transition-all duration-1000 ease-out ${
                    textVisible 
                        ? 'opacity-100 translate-y-0 scale-100' 
                        : 'opacity-0 translate-y-20 scale-95'
                }`}
                style={{ fontFamily: 'Inter, sans-serif' }}
            >
                NombreDeLaApp
            </h1>
        </div>
    );
};

export default AnimatedSplash;
```

> **Personalización:** Cambiar `NombreDeLaApp`, colores, y animación según la marca.

---

## Paso 8: Orquestación en App.tsx

```tsx
import { useState, useEffect } from 'react';
import { SplashScreen } from '@capacitor/splash-screen';
import AnimatedSplash from './components/Splash/AnimatedSplash';

const App = () => {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const handleSplash = async () => {
      // Safety delay: esperar a que React haya pintado el fondo verde
      // antes de ocultar el splash nativo. Ajustar según dispositivo target.
      // 200-300ms es un buen punto de partida.
      await new Promise(resolve => setTimeout(resolve, 270));

      // Ocultar splash nativo con fade out suave
      await SplashScreen.hide({
        fadeOutDuration: 500
      });

      // Mantener el splash React visible para la animación
      setTimeout(() => {
        // Limpiar el fondo verde inline del body
        document.body.style.backgroundColor = '';
        setShowSplash(false);
      }, 2500);
    };

    handleSplash();
  }, []);

  if (showSplash) {
    return <AnimatedSplash />;
  }

  // ... resto de la app
};
```

### Parámetros Ajustables:

| Parámetro | Valor | Efecto |
|-----------|-------|--------|
| Safety delay | `270ms` | Tiempo de espera antes de ocultar splash nativo. Subir si hay parpadeo en dispositivos lentos. |
| `fadeOutDuration` | `500ms` | Duración del fade out del splash nativo. |
| Splash React duration | `2500ms` | Cuánto tiempo se muestra la animación de texto antes de ir a la app. |

---

## Paso 9: Sincronizar y Probar

```bash
npm run build && npx cap sync android
npx cap open android
```

Probar en:
- [ ] Dispositivo físico (cold start)
- [ ] Emulador (cold start)
- [ ] Verificar que NO haya flash blanco entre transiciones
- [ ] Verificar que la animación del texto sea fluida
- [ ] Verificar que los colores normales de la app se restauren después del splash

---

## Troubleshooting

### Sigue apareciendo una pantalla blanca
1. Verificar que el `backgroundColor` **top-level** en `capacitor.config.ts` esté configurado
2. Verificar que `index.html` tenga `style="background-color: #COLOR;"` inline en el `<body>`
3. Verificar que `styles.xml` tenga `android:background` = `@color/splash_background` en `AppTheme.NoActionBar`
4. Aumentar el safety delay en `App.tsx` (ej. de 270ms a 500ms)

### El splash nativo se oculta solo
- Verificar que `launchAutoHide: false` en `capacitor.config.ts`
- Verificar que `launchShowDuration: 0`

### El logo se ve estirado
- Usar `layer-list` con `android:gravity="center"` en `splash.xml`
- No usar `CENTER_CROP` como `androidScaleType` si el logo debe mantener proporción

### Los colores de la app se ven verdes después del splash
- Asegurar que `document.body.style.backgroundColor = ''` se ejecute al terminar el splash
- El CSS de la app debe sobreescribir el fondo del body con sus propios colores

---

## Checklist Final

- [ ] `colors.xml` tiene `splash_background` definido
- [ ] `splash.xml` usa `layer-list` con icono centrado
- [ ] `styles.xml` → `AppTheme.NoActionBar` tiene `android:background` = color del splash
- [ ] `styles.xml` → `AppTheme.NoActionBarLaunch` usa `Theme.SplashScreen` con colores correctos
- [ ] `capacitor.config.ts` → `backgroundColor` **top-level** configurado
- [ ] `capacitor.config.ts` → `SplashScreen.launchAutoHide = false`
- [ ] `capacitor.config.ts` → `SplashScreen.launchShowDuration = 0`
- [ ] `index.html` → `<body>` tiene `style="background-color: #COLOR;"` inline
- [ ] `index.css` → `body` tiene `background-color` como respaldo
- [ ] `AnimatedSplash.tsx` → Componente con `bg-[#COLOR]` y animación
- [ ] `App.tsx` → Safety delay + `SplashScreen.hide()` con `fadeOutDuration` + limpieza del body
