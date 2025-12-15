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

const DirectionButton: React.FC<{direction: Direction, onClick: () => void}> = ({ direction, onClick }) => {
  const isLong = direction === Direction.LONG;
  const config = {
    label: isLong ? 'Compra' : 'Venta',
    subLabel: isLong ? 'Long' : 'Short',
    Icon: isLong ? ArrowUpIcon : ArrowDownIcon,
    colorClasses: isLong ? 'text-brand-success hover:bg-brand-success/10 hover:border-brand-success' : 'text-brand-danger hover:bg-brand-danger/10 hover:border-brand-danger',
  };
  
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-8 rounded-3xl bg-brand-light border-2 border-brand-border-secondary/50 transition-all duration-200 active:scale-95 ${config.colorClasses}`}
    >
      <config.Icon className="w-10 h-10 mb-3" />
      <span className="text-xl font-bold">{config.label}</span>
      <span className="text-sm font-medium opacity-70">{config.subLabel}</span>
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
  
  const directionColor = direction === Direction.LONG ? 'text-brand-success' : 'text-brand-danger';
  const directionText = direction === Direction.LONG ? 'LONG' : 'SHORT';

  const header = (
      <div className="flex items-center gap-4 mb-6 animate-fade-in">
        <button onClick={backButtonAction} aria-label="Volver" className="bg-brand-light border border-brand-border-secondary text-brand-text p-2 rounded-full hover:bg-brand-tertiary transition-colors">
          <ArrowLeftIcon className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-brand-text">{symbol}</h1>
          {direction !== Direction.NONE && (
            <p className={`text-sm font-bold ${directionColor} uppercase tracking-wide`}>{`Análisis ${directionText}`}</p>
          )}
        </div>
      </div>
  );

  if (direction === Direction.NONE) {
    return (
      <div className="p-4 sm:p-6 max-w-2xl mx-auto flex flex-col min-h-[90vh]">
        {header}
        <div className="flex-grow flex flex-col items-center justify-center animate-fade-in-up">
          <h2 className="text-2xl font-bold text-brand-text mb-2 text-center">Selecciona una Dirección</h2>
          <p className="text-brand-text-secondary mb-8 text-center">¿Cuál es tu hipótesis para {symbol}?</p>
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
            if(item.type === ChecklistItemType.BOOLEAN || item.type === ChecklistItemType.OPTIONS) {
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
          <span className="text-xs font-bold uppercase tracking-wider text-brand-text-secondary">Progreso</span>
          <span className="text-xs font-bold text-brand-text-secondary">{Math.min(currentQuestionIndex, totalQuestions)} / {totalQuestions}</span>
        </div>
        <div className="w-full bg-brand-tertiary rounded-full h-2">
          <div className="bg-brand-accent h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
        </div>
      </div>

      <div className="flex-grow flex items-center justify-center relative">
            <div 
              key={currentQuestionIndex}
              className={`bg-brand-light p-6 sm:p-10 rounded-3xl shadow-sm border border-brand-border-secondary w-full animate-fade-in-up flex flex-col items-center`}
            >
              <span className="px-3 py-1 bg-brand-accent-container text-brand-accent text-xs font-bold rounded-lg mb-6 uppercase tracking-wider">{phaseTitle}</span>
              
              <div className="text-center mb-8 w-full">
                <div className="inline-block mb-4">
                    <span className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-tertiary text-brand-text font-mono font-bold text-lg">
                        {currentItem.timeframe}
                    </span>
                </div>
                <h2 className="text-xl sm:text-3xl font-medium text-brand-text leading-tight">
                  {currentItem.text}
                </h2>
              </div>

              {/* Dynamic input based on item type */}
              <div className="w-full mb-8">
                {currentItem.type === ChecklistItemType.OPTIONS && (
                  <div className="max-w-xs mx-auto">
                    <div className="flex items-center justify-between mb-2">
                        <label htmlFor="option-select" className="text-sm font-medium text-brand-text-secondary">Selecciona una opción</label>
                        {currentItem.tooltip && (
                            <div className="group relative flex justify-center">
                                <InfoIcon className="w-4 h-4 text-brand-text-secondary cursor-help" />
                                <span className="absolute bottom-full mb-2 w-48 bg-brand-dark text-brand-text text-xs p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
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
                        setOptionSelections(prev => ({...prev, [currentItem.id]: value}));
                        onUpdateOptionSelection(currentItem.id, value);
                        if (optionError) setOptionError(false);
                      }}
                      className={`w-full bg-brand-tertiary border-b border-brand-text-secondary rounded-t-lg px-4 py-3 text-brand-text focus:border-brand-accent outline-none transition-colors appearance-none text-lg ${optionError ? 'border-brand-danger' : ''}`}
                    >
                      <option value="" disabled>Elige una opción...</option>
                      {currentItem.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                    {optionError && <p className="text-brand-danger text-xs mt-2 font-medium">Campo requerido.</p>}
                  </div>
                )}
                 {currentItem.type === ChecklistItemType.VALUE && (
                    <div className="max-w-xs mx-auto">
                      <label htmlFor="value-input" className="text-sm font-medium text-brand-text-secondary mb-2 block">Valor / Nota</label>
                      <input
                          id="value-input"
                          type="text"
                          value={valueInput}
                          onChange={e => setValueInput(e.target.value)}
                          className="w-full bg-brand-tertiary border-b border-brand-text-secondary rounded-t-lg px-4 py-3 text-brand-text focus:border-brand-accent outline-none transition-colors text-lg"
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
                      className="flex flex-col items-center justify-center py-5 rounded-2xl bg-brand-danger/10 text-brand-danger hover:bg-brand-danger/20 transition-colors font-bold text-lg active:scale-95"
                    >
                      <XCircleIcon className="w-8 h-8 mb-2" />
                      No
                    </button>
                    <button
                      onClick={() => handleAnswerChange(currentItem.id, true)}
                      className="flex flex-col items-center justify-center py-5 rounded-2xl bg-brand-success/10 text-brand-success hover:bg-brand-success/20 transition-colors font-bold text-lg active:scale-95"
                    >
                      <CheckCircleIcon className="w-8 h-8 mb-2" />
                      Sí
                    </button>
                  </>
                )}
                 {currentItem.type === ChecklistItemType.VALUE && (
                    <button
                      onClick={() => handleAnswerChange(currentItem.id, valueInput)}
                      disabled={!valueInput.trim()}
                      className="col-span-2 flex items-center justify-center gap-2 py-4 rounded-full bg-brand-accent text-white font-bold text-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                    >
                      <SaveIcon className="w-6 h-6" />
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