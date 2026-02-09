---
description: Scaffolding for Material Design 3 Design System in React/Tailwind projects
---

## Material Design 3 Design System Scaffolding

Use this workflow to implement a premium Material Design 3 theme in your project.

### 1. Add MD3 Color Palette and Tokens
Create or update `index.css` with the MD3 design tokens:

```css
@import "tailwindcss";
@config "./tailwind.config.js";

:root {
  --md-sys-color-surface: 248 249 255;
  --md-sys-color-primary: 0 90 193;
  --md-sys-color-on-primary: 255 255 255;
  --md-sys-color-primary-container: 216 226 255;
  --md-sys-color-secondary: 85 95 113;
  --md-sys-color-error: 186 26 26;
  --md-sys-color-on-surface: 27 27 31;
  --md-sys-color-outline: 116 119 127;
  /* Add more tokens as needed from the reference project */
}

html.dark {
  --md-sys-color-surface: 20 18 24;
  --md-sys-color-primary: 176 200 255;
  --md-sys-color-on-primary: 0 48 106;
}
```

### 2. Configure Tailwind Theme Extensions
Update `tailwind.config.js` to map these CSS variables to Tailwind utilities:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                'md-surface': 'rgb(var(--md-sys-color-surface))',
                'md-primary': 'rgb(var(--md-sys-color-primary))',
                'md-on-primary': 'rgb(var(--md-sys-color-on-primary))',
                'md-primary-container': 'rgb(var(--md-sys-color-primary-container))',
                'md-on-surface': 'rgb(var(--md-sys-color-on-surface))',
                'brand-dark': 'rgb(var(--md-sys-color-surface))',
                'brand-accent': 'rgb(var(--md-sys-color-primary))',
            },
            borderRadius: {
                'md-xs': '4px',
                'md-sm': '8px',
                'md-md': '12px',
                'md-lg': '16px',
                'md-xl': '28px',
                'md-full': '9999px',
            },
            boxShadow: {
                'md-elevation-1': '0px 1px 3px 1px rgba(0, 0, 0, 0.15)',
                'md-elevation-2': '0px 2px 6px 2px rgba(0, 0, 0, 0.15)',
            }
        }
    }
}
```

### 3. Setup Typography (Roboto)
Add the Google Fonts link to your `index.html`:
```html
<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
```

And update `tailwind.config.js`:
```javascript
fontFamily: {
    sans: ['Roboto', 'sans-serif'],
},
```

### 4. Global Body Styles
Apply the theme to the body in `index.html`:
```html
<body class="bg-md-surface text-md-on-surface">
```
