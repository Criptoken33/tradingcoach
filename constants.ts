import { Phase } from './types';

export const CURRENCY_PAIRS: string[] = [
  'EURUSD', 'GBPUSD', 'AUDUSD', 'NZDUSD', 'USDCAD', 'USDJPY', 'USDCHF'
];

export const CURRENCY_INFO: { [key: string]: { name: string; countryCode: string } } = {
  EUR: { name: 'Euro', countryCode: 'eu' },
  GBP: { name: 'Libra esterlina', countryCode: 'gb' },
  USD: { name: 'Dólar estadounidense', countryCode: 'us' },
  AUD: { name: 'Dólar australiano', countryCode: 'au' },
  NZD: { name: 'Dólar neozelandés', countryCode: 'nz' },
  CAD: { name: 'Dólar canadiense', countryCode: 'ca' },
  JPY: { name: 'Yen japonés', countryCode: 'jp' },
  CHF: { name: 'Franco suizo', countryCode: 'ch' },
};

export const PIVOT_POINTS: string[] = [
  'PP', 'S1', 'S2', 'S3', 'S4', 'S5', 'R1', 'R2', 'R3', 'R4', 'R5'
];

export const TRADING_TIPS: string[] = [
  "Sudar más en el entrenamiento sangra menos en la batalla.",
  "Prepárate para las oportunidades.",
  "El diario es la herramienta más importante.",
  "Tu enfoque de trading debe corresponder a tu estilo de vida.",
  "Los mercados son afectados por datos económicos.",
  "Las ideas no te hacen rico. La correcta ejecución de una idea sí lo hace. — Felix Dennis",
  "Siempre ejecuta tus ideas primero en la cuenta demo.",
  "Sin datos comprobados, nunca será prudente implementar una nueva estrategia en tu cuenta de prop firm.",
  "La recopilación de datos es algo maravilloso. Pero estudiarlos es la única manera de utilizarlos.",
  "Evita pensar demasiado.",
  "Mientras puedas mantener tus pérdidas cortas y manejar tus riesgos adecuadamente, no necesitas pensar, y mucho menos pensar demasiado.",
  "Solo Ejecuta - Monitorea - Registra.",
  "El mayor desafío que enfrentan es la emoción.",
  "Las emociones hacen que los traders de prop ignoren sus planes, participen en operaciones excesivas, asuman riesgos innecesarios o utilicen tácticas no probadas.",
  "No tenemos poder sobre nuestras emociones. Pero podemos disminuir su impacto.",
  "Da un paso atrás si crees que tus emociones pueden afectar tu operación. No tienes que operar todos los días.",
  "Si puedes aprender a crear un estado mental que no sea afectado por el comportamiento del mercado, la lucha dejará de existir. — Mark Douglas",
  "No importa qué tan hábil seas, si operas durante demasiado tiempo, perderás.",
  "Es más sencillo aceptar esos pequeños contratiempos... una vez que reconozcas que perder es parte del juego.",
  "El trading es difícil. Como cualquier emprendimiento exitoso, ocasionalmente necesitamos un descanso.",
  "Las pausas nos permiten reiniciar y reorientarnos, lo cual es especialmente útil cuando comienzan a aparecer comportamientos indeseables.",
  "Señales de que necesitas una pausa: Operar en exceso, pérdidas grandes, revisar operaciones perdedoras constantemente en la mente, irritabilidad o pérdida de sueño.",
  "El objetivo de un trader exitoso es realizar las mejores operaciones. El dinero es secundario. ― Alexander Elder",
  "Comienza con una cuenta propietaria pequeña.",
  "No te concentres en las ganancias generales. Considera los cambios porcentuales en su lugar.",
  "Las ganancias seguirán a las decisiones acertadas, así que tómate tu tiempo para analizarlas.",
  "En cambio [los traders de élite], toman las mejores decisiones posibles, confiando en que los resultados eventualmente jugarán a su favor.",
  "Todas tus operaciones necesitan tener una entrada, objetivo, stop y tamaño antes de empezar.",
  "Nunca cambies tu stop móvil.",
  "Una vez que hacemos un clic, tu futuro está decidido.",
  "Revisa la correlación del mercado antes de ejecutar una operación.",
  "El objetivo es evitar que una racha de pérdidas dañe tu cuenta de trading propietario.",
  "No temas a los riesgos. Compréndelos, y gestiona y minimízalos hasta un nivel aceptable. ― Naved Abdali",
  "Nunca elijas el tamaño de una posición al azar.",
  "Tu mejor pérdida es la primera.",
  "Toma pérdidas mínimas antes de que crezcan en mayores.",
  "Intenta mantener tu ego bajo control y no intentes recuperar tus pérdidas el mismo día.",
  "No arriesgues algo que no puedas perder.",
  "Siempre ten un stop loss y una orden objetivo por si acaso."
];

export const EXIT_REASONS: string[] = [
  "Alcanzó Objetivo (TP)",
  "Saltó Stop (SL)",
  "Cierre Discrecional por Debilidad/Fortaleza",
  "Cierre por Tiempo",
  "Error de Análisis"
];