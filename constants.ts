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
  "Suda en el entreno, sangra menos en la batalla.",
  "Prepárate para las oportunidades.",
  "El diario es tu herramienta más importante.",
  "Tu trading debe encajar con tu vida.",
  "Datos económicos mueven mercados.",
  "La riqueza viene de la ejecución, no de la idea.",
  "Prueba ideas en demo primero.",
  "Sin datos, no arriesgues tu cuenta real.",
  "Recopila datos y estúdialos para ganar.",
  "Evita pensar demasiado.",
  "Gestiona el riesgo y evita pensar de más.",
  "Solo Ejecuta - Monitorea - Registra.",
  "El mayor desafío es la emoción.",
  "Las emociones causan errores y sobreoperativa.",
  "No controlas la emoción, pero sí su impacto.",
  "Si hay emoción, no operes hoy.",
  "Domina tu mente y acabarás con la lucha.",
  "Si operas demasiado tiempo, perderás.",
  "Acepta perder como parte del juego.",
  "El trading es duro, descansa si es necesario.",
  "Pausa para reiniciar tu mente.",
  "Pausa si operas en exceso o duermes mal.",
  "Opera bien, el dinero es secundario.",
  "Empieza con cuenta pequeña.",
  "Enfócate en porcentajes, no en montos.",
  "Analiza bien, las ganancias llegarán.",
  "Toma buenas decisiones, confía en el proceso.",
  "Define Entrada, TP, SL y Lote antes de operar.",
  "Nunca muevas tu Stop Loss en contra.",
  "Tras el clic, el mercado decide.",
  "Revisa correlaciones antes de operar.",
  "Evita que las rachas dañen tu cuenta.",
  "Gestiona el riesgo, no le temas.",
  "Calcula tu lotaje, no adivines.",
  "Tu mejor pérdida es la primera.",
  "Corta pérdidas rápido.",
  "Controla el ego, no persigas pérdidas.",
  "Arriesga solo lo que puedas perder.",
  "Usa siempre Stop Loss y Take Profit."
];

export const EXIT_REASONS: string[] = [
  "Alcanzó Objetivo (TP)",
  "Saltó Stop (SL)",
  "Cierre Discrecional por Debilidad/Fortaleza",
  "Cierre por Tiempo",
  "Error de Análisis"
];