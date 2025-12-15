import React, { useState, useEffect, useMemo } from 'react';
import { PairState, Direction, RiskPlan } from '../types';
import { InfoIcon, ArrowLeftIcon, ArrowUpIcon, ArrowDownIcon } from './icons';
import { CURRENCY_PAIRS } from '../constants';
import AlertMessage from './AlertMessage';

interface RiskManagementScreenProps {
  pairState?: PairState;
  accountBalance: number;
  onSavePlan?: (plan: RiskPlan) => void;
  onBack: () => void;
  recommendedRisk: number;
}

interface DirectionButtonsProps {
    direction: Direction;
    onChangeDirection: (direction: Direction) => void;
}

const DirectionButtons: React.FC<DirectionButtonsProps> = ({ direction, onChangeDirection }) => (
    <div className="flex items-center bg-brand-tertiary/50 rounded-full p-1">
        <button
            onClick={() => onChangeDirection(Direction.LONG)}
            className={`flex-1 rounded-full transition-colors flex justify-center items-center gap-2 text-sm font-bold py-3 ${direction === Direction.LONG ? 'bg-brand-success text-white shadow-sm' : 'text-brand-text-secondary hover:bg-brand-tertiary'}`}
        >
            <ArrowUpIcon className="w-4 h-4" /> COMPRA
        </button>
        <button
            onClick={() => onChangeDirection(Direction.SHORT)}
            className={`flex-1 rounded-full transition-colors flex justify-center items-center gap-2 text-sm font-bold py-3 ${direction === Direction.SHORT ? 'bg-brand-danger text-white shadow-sm' : 'text-brand-text-secondary hover:bg-brand-tertiary'}`}
        >
            <ArrowDownIcon className="w-4 h-4" /> VENTA
        </button>
    </div>
);


const RiskManagementScreen: React.FC<RiskManagementScreenProps> = ({ pairState, accountBalance, onSavePlan, onBack, recommendedRisk }) => {
  const isCalculatorMode = !pairState;

  const [internalSymbol, setInternalSymbol] = useState(CURRENCY_PAIRS[0]);
  const [internalDirection, setInternalDirection] = useState<Direction>(Direction.LONG);

  const symbol = isCalculatorMode ? internalSymbol : pairState.symbol;
  const direction = isCalculatorMode ? internalDirection : pairState.direction;

  const [entryPrice, setEntryPrice] = useState('');
  const [stopLossPrice, setStopLossPrice] = useState('');
  const [takeProfitPrice, setTakeProfitPrice] = useState('');

  const [riskRewardRatio, setRiskRewardRatio] = useState<number | null>(null);
  const [positionSize, setPositionSize] = useState<number | null>(null);
  const [potentialLoss, setPotentialLoss] = useState<number | null>(null);
  const [potentialProfit, setPotentialProfit] = useState<number | null>(null);
  const [pipValue, setPipValue] = useState<number | null>(null);
  const [rrError, setRrError] = useState<string | null>(null);
  const [priceLogicError, setPriceLogicError] = useState<string | null>(null);
  const [riskWarning, setRiskWarning] = useState<string | null>(null);
  const [stopLossWarning, setStopLossWarning] = useState<string | null>(null);
  
  const riskPercentage = String(recommendedRisk);

  const isValid = useMemo(() => {
    return accountBalance > 0 &&
           parseFloat(riskPercentage) > 0 &&
           parseFloat(entryPrice) > 0 &&
           parseFloat(stopLossPrice) > 0 &&
           parseFloat(takeProfitPrice) > 0;
  }, [accountBalance, riskPercentage, entryPrice, stopLossPrice, takeProfitPrice]);

  useEffect(() => {
    // Reset all errors/warnings initially
    setPriceLogicError(null);
    setRiskWarning(null);
    setStopLossWarning(null);
    setRrError(null);
    setRiskRewardRatio(null);
    setPositionSize(null);
    setPotentialLoss(null);
    setPotentialProfit(null);
    setPipValue(null);
    
    if (!isValid) return;

    const entry = parseFloat(entryPrice);
    const sl = parseFloat(stopLossPrice);
    const tp = parseFloat(takeProfitPrice);
    const balance = accountBalance;
    const risk = parseFloat(riskPercentage);

    // Validate price logic based on direction
    if (direction === Direction.LONG) {
        if (entry <= sl) {
            setPriceLogicError('El Stop Loss debe estar por debajo de la Entrada (Long).');
            return;
        }
        if (tp <= entry) {
            setPriceLogicError('El Take Profit debe estar por encima de la Entrada (Long).');
            return;
        }
    }
    if (direction === Direction.SHORT) {
        if (entry >= sl) {
            setPriceLogicError('El Stop Loss debe estar por encima de la Entrada (Short).');
            return;
        }
        if (tp >= entry) {
            setPriceLogicError('El Take Profit debe estar por debajo de la Entrada (Short).');
            return;
        }
    }
    
    // Risk % Warning
    if (risk > 3) {
        setRiskWarning('Riesgo > 3% es agresivo.');
    }

    // Stop Loss distance Warning
    const pipMultiplier = symbol.includes('JPY') ? 100 : 10000;
    const slPips = Math.abs(entry - sl) * pipMultiplier;
    if (slPips > 0 && slPips < 5) {
        setStopLossWarning(`Stop muy ajustado (${slPips.toFixed(1)} pips).`);
    }
    
    // Monetary calculations
    const moneyToRisk = balance * (risk / 100);
    setPotentialLoss(moneyToRisk);

    // Calculate Risk/Reward Ratio
    const riskAmount = Math.abs(entry - sl);
    const rewardAmount = Math.abs(tp - entry);

    if (riskAmount > 0) {
      const ratio = rewardAmount / riskAmount;
      setRiskRewardRatio(ratio);
      setPotentialProfit(moneyToRisk * ratio);
       if (ratio < 2) {
        setRrError('R/B menor a 1:2.');
      }
    } else {
      setRiskRewardRatio(null);
      setPotentialProfit(null);
    }

    // Calculate Position Size (Lots)
    const moneyToRiskForCalc = balance * (risk / 100);
    const riskPerUnitInQuoteCurrency = Math.abs(entry - sl);
    let calculatedLots: number | null = null;

    if (riskPerUnitInQuoteCurrency > 0) {
        const baseCurrency = symbol.substring(0, 3);
        const quoteCurrency = symbol.substring(3, 6);
        let riskPerUnitInAccountCurrency;

        if (quoteCurrency === 'USD') {
            riskPerUnitInAccountCurrency = riskPerUnitInQuoteCurrency;
        } else if (baseCurrency === 'USD') {
            riskPerUnitInAccountCurrency = riskPerUnitInQuoteCurrency / entry;
        } else {
            riskPerUnitInAccountCurrency = riskPerUnitInQuoteCurrency; 
        }
        
        if (riskPerUnitInAccountCurrency > 0) {
            const units = moneyToRiskForCalc / riskPerUnitInAccountCurrency;
            calculatedLots = units / 100000; // Standard lot size
            setPositionSize(calculatedLots);
        } else {
            setPositionSize(null);
        }
    } else {
        setPositionSize(null);
    }

    // Calculate Pip Value
    if (calculatedLots) {
        const units = calculatedLots * 100000;
        const pipDecimal = symbol.includes('JPY') ? 0.01 : 0.0001;
        const baseCurrency = symbol.substring(0, 3);
        const quoteCurrency = symbol.substring(3, 6);
        let pipValueInUSD;
        if (quoteCurrency === 'USD') {
            pipValueInUSD = pipDecimal * units;
        } else if (baseCurrency === 'USD') {
            pipValueInUSD = (pipDecimal * units) / entry;
        } else {
            pipValueInUSD = null;
        }
        setPipValue(pipValueInUSD);
    } else {
        setPipValue(null);
    }

  }, [accountBalance, riskPercentage, entryPrice, stopLossPrice, takeProfitPrice, direction, isValid, symbol]);

  const handleSave = () => {
    if (!isValid || !!priceLogicError || !riskRewardRatio || riskRewardRatio < 2 || !onSavePlan) return;

    onSavePlan({
        riskPercentage: parseFloat(riskPercentage),
        entryPrice: parseFloat(entryPrice),
        stopLossPrice: parseFloat(stopLossPrice),
        takeProfitPrice: parseFloat(takeProfitPrice),
        riskRewardRatio: riskRewardRatio,
        positionSizeLots: positionSize,
    });
  };

  const directionColor = direction === Direction.LONG ? 'text-brand-success' : 'text-brand-danger';
  const directionText = direction === Direction.LONG ? 'COMPRA' : 'VENTA';

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto animate-fade-in pb-24">
        <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
                 <button onClick={onBack} aria-label="Volver" className="bg-brand-light border border-brand-border-secondary text-brand-text p-2 rounded-full hover:bg-brand-tertiary transition-colors">
                    <ArrowLeftIcon className="w-6 h-6" />
                </button>
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-brand-text">{isCalculatorMode ? 'Calculadora' : 'Gestión del Riesgo'}</h1>
                    {!isCalculatorMode && <p className="text-sm font-bold text-brand-text-secondary">{symbol} &bull; <span className={directionColor}>{directionText}</span></p>}
                </div>
            </div>
        </div>
        
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Column 1: Inputs */}
            <div className="bg-brand-light p-6 rounded-3xl border border-brand-border-secondary shadow-sm space-y-5">
                <h3 className="text-lg font-bold text-brand-text pb-2">Parámetros</h3>
                 {isCalculatorMode && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-brand-text-secondary mb-1 uppercase tracking-wider">Símbolo</label>
                            <div className="relative">
                                <select value={internalSymbol} onChange={e => setInternalSymbol(e.target.value)} className="w-full bg-brand-tertiary border-b border-brand-text-secondary rounded-t-lg px-4 py-3 text-brand-text focus:border-brand-accent outline-none appearance-none transition-colors">
                                    {CURRENCY_PAIRS.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-brand-text-secondary">
                                    <ArrowDownIcon className="w-4 h-4" />
                                </div>
                            </div>
                        </div>
                        <div>
                             <DirectionButtons direction={internalDirection} onChangeDirection={setInternalDirection} />
                        </div>
                    </div>
                )}
                <div>
                  <Input label="Riesgo (%)" type="number" value={riskPercentage} readOnly className="font-bold text-brand-accent !bg-brand-tertiary/50" />
                  {riskWarning && <AlertMessage type="warning" text={riskWarning} size="small" />}
                </div>
                <Input label="Entrada" type="number" min="0" value={entryPrice} onChange={e => setEntryPrice(e.target.value)} placeholder="0.00000" step="0.00001" />
                <Input label="Take Profit" type="number" min="0" value={takeProfitPrice} onChange={e => setTakeProfitPrice(e.target.value)} placeholder="0.00000" step="0.00001" />
                <div>
                  <Input label="Stop Loss" type="number" min="0" value={stopLossPrice} onChange={e => setStopLossPrice(e.target.value)} placeholder="0.00000" step="0.00001" />
                  {stopLossWarning && <AlertMessage type="warning" text={stopLossWarning} size="small" />}
                </div>
            </div>

            {/* Column 2: Calculations */}
            <div className="bg-brand-light p-6 rounded-3xl border border-brand-border-secondary shadow-sm space-y-5">
                <h3 className="text-lg font-bold text-brand-text pb-2">Resultados</h3>
                {priceLogicError && <AlertMessage type="error" text={priceLogicError} />}
                <div className={`space-y-4 ${priceLogicError ? 'opacity-50 grayscale' : ''}`}>
                    <div className="grid grid-cols-2 gap-4">
                        <CalculatedField label="Pérdida" value={potentialLoss ? `-$${potentialLoss.toFixed(2)}` : '---'} isLoss />
                        <CalculatedField label="Ganancia" value={potentialProfit ? `+$${potentialProfit.toFixed(2)}` : '---'} isGain />
                    </div>
                    <div>
                        <CalculatedField label="Ratio Riesgo/Beneficio" value={riskRewardRatio ? `1 : ${riskRewardRatio.toFixed(2)}` : '---'} hasError={!!rrError} large />
                        {rrError && <AlertMessage type="error" text={rrError} size="small" />}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <CalculatedField label="Lotes" value={positionSize ? positionSize.toFixed(2) : '---'} />
                        <CalculatedField label="Valor Pip" value={pipValue ? `$${pipValue.toFixed(2)}` : '---'} />
                    </div>
                </div>
            </div>
      </div>
      
      {/* Action Button Footer */}
      {onSavePlan && (
        <div className="mt-10 flex justify-center w-full animate-fade-in-up">
            <button
              onClick={handleSave}
              disabled={!isValid || !!priceLogicError || !riskRewardRatio || riskRewardRatio < 2}
              aria-label="Ejecutar"
              className="w-full sm:w-auto sm:min-w-[240px] bg-brand-accent hover:brightness-110 text-white text-lg font-bold py-4 px-12 rounded-full shadow-xl transition-all active:scale-95 disabled:bg-brand-tertiary disabled:text-brand-text-secondary disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center"
            >
              Ejecutar
            </button>
        </div>
      )}
    </div>
  );
};

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & {label: string}> = ({label, ...props}) => (
    <div className="relative group">
        <label className="block text-xs font-bold text-brand-text-secondary mb-1 uppercase tracking-wider">{label}</label>
        <input {...props} className={`w-full bg-brand-tertiary border-b-2 border-brand-text-secondary/50 rounded-t-lg px-4 py-3 text-brand-text text-lg focus:border-brand-accent outline-none transition-colors placeholder:text-brand-text-secondary/30 ${props.readOnly ? 'cursor-default' : ''} ${props.className}`} />
    </div>
);

const CalculatedField: React.FC<{label: string, value: string, hasError?: boolean, isGain?: boolean, isLoss?: boolean, large?: boolean}> = ({label, value, hasError, isGain, isLoss, large}) => {
    let colorClass = 'text-brand-text';
    if (isGain) colorClass = 'text-brand-success';
    if (isLoss) colorClass = 'text-brand-danger';
    if (large) colorClass = 'text-brand-accent';

    return (
        <div className={`bg-brand-tertiary rounded-2xl p-4 border border-brand-border-secondary/50 flex flex-col justify-center items-center ${hasError ? 'ring-2 ring-brand-danger bg-brand-danger/5' : ''}`}>
            <span className="text-xs font-bold text-brand-text-secondary uppercase tracking-wider mb-1">{label}</span>
            <span className={`font-mono font-bold ${large ? 'text-3xl' : 'text-xl'} ${colorClass}`}>
                {value}
            </span>
        </div>
    );
};

export default RiskManagementScreen;