import React from 'react';
import { BookOpenIcon } from './icons';

const Philosophy: React.FC = () => {
  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto animate-fade-in">
      <div className="flex items-center mb-8">
        <BookOpenIcon className="w-10 h-10 text-brand-accent mr-4" />
        <h1 className="text-3xl sm:text-4xl font-bold text-brand-text">Filosofía y Herramientas</h1>
      </div>

      <div className="space-y-8">
        <div className="bg-brand-light p-6 rounded-lg border border-brand-border">
          <h2 className="text-2xl font-semibold text-brand-accent mb-3">Fundamentos Wyckoff</h2>
          <p className="text-brand-text leading-relaxed">
            La metodología Wyckoff se centra en analizar la relación entre la oferta y la demanda para determinar la dirección futura del precio. Se basa en tres leyes fundamentales y el análisis de las fases de Acumulación (compra institucional) y Distribución (venta institucional).
          </p>
          <ul className="list-disc list-inside mt-4 space-y-2 text-brand-text-secondary">
            <li><strong>Ley de Oferta y Demanda:</strong> Cuando la demanda supera la oferta, los precios suben, y viceversa.</li>
            <li><strong>Ley de Causa y Efecto:</strong> La duración y magnitud de una fase de Acumulación/Distribución (causa) determina la extensión del movimiento de precios posterior (efecto).</li>
            <li><strong>Ley de Esfuerzo vs. Resultado:</strong> La convergencia o divergencia entre el volumen (esfuerzo) y el movimiento del precio (resultado) puede señalar un cambio de tendencia.</li>
          </ul>
        </div>

        <div className="bg-brand-light p-6 rounded-lg border border-brand-border">
          <h2 className="text-2xl font-semibold text-brand-accent mb-3">Orquestación de Indicadores</h2>
          <p className="text-brand-text mb-4 leading-relaxed">
            Cada herramienta tiene un rol específico en el proceso de decisión, trabajando en conjunto para construir un caso de alta probabilidad.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ToolCard title="Wyckoff" role="El 'Porqué' (Lógica)" description="Provee la lógica subyacente del mercado, identificando la intención de los grandes operadores." />
            <ToolCard title="INDICIO-TEST-CONFIRMACIÓN" role="El 'Cuándo' (Proceso)" description="Es la secuencia procesal que nos guía paso a paso, asegurando que todas las condiciones se alineen antes de actuar." />
            <ToolCard title="Volumen + MA 20" role="El 'Esfuerzo' (Intensidad)" description="Mide la intensidad y el compromiso detrás de un movimiento de precios. Es crucial para validar las velas de parada y los testeos." />
            <ToolCard title="Pivot Points Diarios" role="El 'Dónde' (Mapa de Liquidez)" description="Actúan como niveles clave de soporte y resistencia donde se espera que ocurran reacciones de precio significativas." />
            <ToolCard title="Estocástico (8,3,3)" role="El 'Impulso' (Momentum)" description="Confirma el agotamiento (sobrecompra/sobreventa) y el inicio de un nuevo impulso en la dirección de nuestra hipótesis." />
          </div>
        </div>
      </div>
    </div>
  );
};

interface ToolCardProps {
    title: string;
    role: string;
    description: string;
}

const ToolCard: React.FC<ToolCardProps> = ({ title, role, description }) => (
  <div className="bg-brand-dark p-4 rounded-md border border-brand-border-secondary">
    <h3 className="font-bold text-brand-text">{title}</h3>
    <p className="text-brand-accent text-sm font-semibold mb-2">{role}</p>
    <p className="text-brand-text-secondary text-sm">{description}</p>
  </div>
);

export default Philosophy;