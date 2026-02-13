import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { PairState, Checklist as ChecklistType, ChecklistAnswers, Direction, Phase, ChecklistItem, ChecklistItemType } from '../types';
import { CheckCircleIcon, XCircleIcon, InfoIcon, ArrowLeftIcon, SaveIcon, ArrowUpIcon, ArrowDownIcon } from './icons';

interface ChecklistProps {
  pairState: PairState;
  checklist: ChecklistType | undefined; // Can be undefined when direction is not set
  onUpdate: (answers: ChecklistAnswers) => void;
  onUpdateOptionSelection: (questionId: string, option: string) => void;
  onChangeDirection: (symbol: string, direction: Direction) => void;
  onBack: () => void;
  onComplete: () => void;
  onShowToast: (message: string) => void;
}

const DirectionButton: React.FC<{ direction: Direction, onClick: () => void }> = ({ direction, onClick }) => {
  const isLong = direction === Direction.LONG;
  const config = {
    label: isLong ? 'Compra' : 'Venta',
    subLabel: isLong ? 'Long' : 'Short',
    Icon: isLong ? ArrowUpIcon : ArrowDownIcon,
    colorClasses: isLong ? 'text-tc-success hover:bg-tc-success/10 hover:border-tc-success' : 'text-tc-error hover:bg-tc-error/10 hover:border-tc-error',
  };

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-8 rounded-3xl bg-tc-bg border-2 border-tc-border-light transition-all duration-200 active:scale-95 ${config.colorClasses}`}
    >
      <config.Icon className="w-10 h-10 mb-3" />
      <span className="text-lg font-semibold">{config.label}</span>
      <span className="text-xs font-medium opacity-70">{config.subLabel}</span>
    </button>
  );
};


const Checklist: React.FC<ChecklistProps> = ({ pairState, checklist, onUpdate, onUpdateOptionSelection, onBack, onComplete, onShowToast, onChangeDirection }) => {
  const { symbol, direction, answers } = pairState;

  const flatItems = useMemo(() =>
    checklist?.phases.flatMap(p => p.items).filter(item => item.text && item.text.trim() !== '') || [],
    [checklist]
  );
  const totalQuestions = flatItems.length;

  const getInitialIndex = useCallback(() => {
    if (totalQuestions === 0) return 0;

    const firstNoIndex = flatItems.findIndex(item => answers[item.id] === false);
    if (firstNoIndex !== -1) {
      return firstNoIndex; // Start at the first 'No' answer
    }

    const firstUnansweredIndex = flatItems.findIndex(item => answers[item.id] === null || answers[item.id] === undefined);
    if (firstUnansweredIndex !== -1) {
      return firstUnansweredIndex; // Start at the first unanswered question
    }

    // If we get here, the checklist is complete (all answers are 'true' or have a value).
    // Show the last question to allow review.
    return totalQuestions > 0 ? totalQuestions - 1 : 0;
  }, [answers, flatItems, totalQuestions]);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(getInitialIndex);
  const [optionSelections, setOptionSelections] = useState(pairState.optionSelections || {});
  const [valueInput, setValueInput] = useState('');
  const [optionError, setOptionError] = useState(false);

  useEffect(() => {
    setCurrentQuestionIndex(getInitialIndex());
  }, [direction, getInitialIndex]);

  useEffect(() => {
    if (direction !== Direction.NONE && !checklist) {
      onShowToast('Error: No se encontró un checklist activo para esta dirección.');
      onBack();
    }
  }, [direction, checklist, onShowToast, onBack]);

  useEffect(() => {
    if (direction !== Direction.NONE && checklist && totalQuestions === 0) {
      onShowToast('Error: El checklist activo no tiene preguntas.');
      onBack();
    }
  }, [totalQuestions, onBack, onShowToast, direction, checklist]);

  const handleStepBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prevIndex => prevIndex - 1);
    } else {
      // At the first question, go back to direction selection
      onChangeDirection(symbol, Direction.NONE);
    }
  };

  const backButtonAction = direction === Direction.NONE ? onBack : handleStepBack;

  const directionColor = direction === Direction.LONG ? 'text-tc-success' : 'text-tc-error';
  const directionText = direction === Direction.LONG ? 'LONG' : 'SHORT';

  const header = (
    <div className="flex items-center gap-4 mb-6 animate-fade-in">
      <button onClick={backButtonAction} aria-label="Volver" className="bg-tc-bg border border-tc-border-light text-tc-text p-2 rounded-full hover:bg-tc-bg-secondary transition-colors">
        <ArrowLeftIcon className="w-6 h-6" />
      </button>
      <div>
        <h1 className="text-xl font-semibold text-tc-text">{symbol}</h1>
        {direction !== Direction.NONE && (
          <p className={`text-xs font-bold ${directionColor} uppercase tracking-wider`}>{`Análisis ${directionText}`}</p>
        )}
      </div>
    </div>
  );

  if (direction === Direction.NONE) {
    return (
      <div className="p-4 sm:p-6 max-w-2xl mx-auto flex flex-col min-h-[90vh]">
        {header}
        <div className="flex-grow flex flex-col items-center justify-center animate-fade-in-up">
          <h2 className="text-xl font-semibold text-tc-text mb-2 text-center">Selecciona una Dirección</h2>
          <p className="text-sm text-tc-text-secondary mb-8 text-center font-medium">¿Cuál es tu hipótesis para {symbol}?</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md">
            <DirectionButton
              direction={Direction.LONG}
              onClick={() => onChangeDirection(symbol, Direction.LONG)}
            />
            <DirectionButton
              direction={Direction.SHORT}
              onClick={() => onChangeDirection(symbol, Direction.SHORT)}
            />
          </div>
        </div>
      </div>
    );
  }

  if (!checklist || totalQuestions === 0) {
    return null; // Effects will handle redirection
  }

  const handleAnswerChange = (id: string, answer: boolean | string) => {
    const currentItem = flatItems[currentQuestionIndex];

    if (answer === true && currentItem.type === ChecklistItemType.OPTIONS && !optionSelections[currentItem.id]) {
      setOptionError(true);
      setTimeout(() => setOptionError(false), 2500);
      return;
    }

    const newAnswers = { ...answers, [id]: answer };
    onUpdate(newAnswers);

    if (answer === false) {
      onShowToast('Condiciones no óptimas. Análisis detenido.');
      setTimeout(() => onBack(), 1200);
      return;
    }

    const nextIndex = currentQuestionIndex + 1;
    const isLastQuestionAnswered = nextIndex === totalQuestions;

    if (isLastQuestionAnswered) {
      const allAnsweredPositively = flatItems.every(item => {
        const answer = newAnswers[item.id];
        if (item.type === ChecklistItemType.BOOLEAN || item.type === ChecklistItemType.OPTIONS) {
          return answer === true;
        }
        return typeof answer === 'string' && answer.length > 0;
      });
      if (allAnsweredPositively) {
        onComplete();
      } else {
        onBack();
      }
    } else {
      setTimeout(() => {
        setCurrentQuestionIndex(nextIndex);
        setValueInput(''); // Reset value input for next question
      }, 50);
    }
  };

  const progress = (Math.min(currentQuestionIndex, totalQuestions) / totalQuestions) * 100;
  const currentItem = flatItems[currentQuestionIndex];

  if (!currentItem) return null; // Safety check

  const currentPhaseInfo = checklist.phases.find(p => p.items.some(i => i.id === currentItem.id));
  const phaseTitle = currentPhaseInfo ? currentPhaseInfo.phase : '';

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto flex flex-col min-h-[90vh]">
      {header}

      <div className="mb-8 animate-fade-in">
        <div className="flex justify-between mb-2 px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-tc-text-secondary">Progreso</span>
          <span className="text-xs font-bold text-tc-text-secondary">{Math.min(currentQuestionIndex, totalQuestions)} / {totalQuestions}</span>
        </div>
        <div className="w-full bg-tc-bg-secondary rounded-full h-2">
          <div className="bg-tc-growth-green h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
        </div>
      </div>

      <div className="flex-grow flex items-center justify-center relative">
        <div
          key={currentQuestionIndex}
          className={`bg-tc-bg p-6 sm:p-10 rounded-3xl shadow-sm border border-tc-border-light w-full animate-fade-in-up flex flex-col items-center`}
        >
          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md mb-6 uppercase tracking-widest ${phaseTitle === Phase.HINT ? 'bg-tc-deep-forest/10 text-tc-deep-forest' :
            phaseTitle === Phase.TEST ? 'bg-tc-matte-green/10 text-tc-matte-green' :
              'bg-tc-growth-green/10 text-tc-growth-green'
            }`}>{phaseTitle}</span>

          <div className="text-center mb-8 w-full">
            <div className="inline-block mb-4">
              <span className="inline-flex items-center justify-center px-2 py-1 rounded-lg bg-tc-bg-secondary text-tc-text font-data font-bold text-sm">
                {currentItem.timeframe}
              </span>
            </div>
            <h2 className="text-lg sm:text-2xl font-semibold text-tc-text leading-tight px-4">
              {currentItem.text}
            </h2>
          </div>

          {/* Dynamic input based on item type */}
          <div className="w-full mb-8">
            {currentItem.type === ChecklistItemType.OPTIONS && (
              <div className="max-w-xs mx-auto">
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="option-select" className="text-xs font-semibold text-tc-text-secondary uppercase tracking-wider">Opción</label>
                  {currentItem.tooltip && (
                    <div className="group relative flex justify-center">
                      <InfoIcon className="w-4 h-4 text-tc-text-secondary cursor-help" />
                      <span className="absolute bottom-full mb-2 w-48 bg-tc-midnight-black text-white text-xs p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        {currentItem.tooltip}
                      </span>
                    </div>
                  )}
                </div>
                <select
                  id="option-select"
                  value={optionSelections[currentItem.id] || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    setOptionSelections(prev => ({ ...prev, [currentItem.id]: value }));
                    onUpdateOptionSelection(currentItem.id, value);
                    if (optionError) setOptionError(false);
                  }}
                  className={`w-full bg-tc-bg-secondary border-b border-tc-border-medium rounded-t-lg px-4 py-3 text-tc-text focus:border-tc-growth-green outline-none transition-colors appearance-none text-base font-medium ${optionError ? 'border-tc-error' : ''}`}
                >
                  <option value="" disabled>Elige una opción...</option>
                  {currentItem.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                {optionError && <p className="text-tc-error text-xs mt-2 font-medium">Campo requerido.</p>}
              </div>
            )}
            {currentItem.type === ChecklistItemType.VALUE && (
              <div className="max-w-xs mx-auto">
                <label htmlFor="value-input" className="text-xs font-semibold text-tc-text-secondary mb-2 block uppercase tracking-wider">Valor / Nota</label>
                <input
                  id="value-input"
                  type="text"
                  value={valueInput}
                  onChange={e => setValueInput(e.target.value)}
                  className="w-full bg-tc-bg-secondary border-b border-tc-border-medium rounded-t-lg px-4 py-3 text-tc-text focus:border-tc-growth-green outline-none transition-colors text-base font-medium"
                  placeholder="Escribe aquí..."
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 w-full max-w-md">
            {(currentItem.type === ChecklistItemType.BOOLEAN || currentItem.type === ChecklistItemType.OPTIONS) && (
              <>
                <button
                  onClick={() => handleAnswerChange(currentItem.id, false)}
                  className="flex flex-col items-center justify-center py-4 rounded-2xl bg-tc-error/10 text-tc-error hover:bg-tc-error/20 transition-colors font-semibold text-sm active:scale-95 border border-tc-error/20"
                >
                  <XCircleIcon className="w-6 h-6 mb-2" />
                  No
                </button>
                <button
                  onClick={() => handleAnswerChange(currentItem.id, true)}
                  className="flex flex-col items-center justify-center py-4 rounded-2xl bg-tc-success/10 text-tc-success hover:bg-tc-success/20 transition-colors font-semibold text-sm active:scale-95 border border-tc-success/20"
                >
                  <CheckCircleIcon className="w-6 h-6 mb-2" />
                  Sí
                </button>
              </>
            )}
            {currentItem.type === ChecklistItemType.VALUE && (
              <button
                onClick={() => handleAnswerChange(currentItem.id, valueInput)}
                disabled={!valueInput.trim()}
                className="col-span-2 flex items-center justify-center gap-2 py-4 rounded-full bg-tc-growth-green hover:bg-tc-growth-green-light active:bg-tc-growth-green-dark text-white font-semibold text-sm hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              >
                <SaveIcon className="w-5 h-5" />
                Confirmar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checklist;