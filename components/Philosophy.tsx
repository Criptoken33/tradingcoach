import { CompassIcon, BrainIcon, ShieldCheckIcon, TargetIcon } from './icons';

export interface PhilosophyTip {
  title: string;
  description: string;
  icon: any;
}

export const REFLECTION_TIPS: PhilosophyTip[] = [
  {
    title: "Preservación del Capital Mental",
    description: "Tu capital más valioso no es el saldo de tu cuenta, es tu capacidad de tomar decisiones racionales. Si el miedo o la revancha dictan tu próxima entrada, ya has perdido.",
    icon: BrainIcon
  },
  {
    title: "El Mercado es Infinito",
    description: "La prisa por recuperar una pérdida solo genera riesgos innecesarios. El mercado siempre dará una nueva oportunidad. Tu única tarea es estar ahí para tomarla, intacto.",
    icon: CompassIcon
  },
  {
    title: "Anatomía de la Pérdida",
    description: "Una pérdida es el costo de hacer negocios, o una lección valiosa. Si seguiste tu sistema, es varianza. Si no, es una oportunidad de aprendizaje crucial.",
    icon: ShieldCheckIcon
  },
  {
    title: "Ejecución sobre Resultado",
    description: "Un trader profesional se juzga por la calidad de su ejecución, no por el resultado de una operación individual. Mantén el foco en el proceso.",
    icon: TargetIcon
  }
];

export const getRandomTip = () => {
  return REFLECTION_TIPS[Math.floor(Math.random() * REFLECTION_TIPS.length)];
};
