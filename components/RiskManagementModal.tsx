import React, { useState, useEffect, useMemo } from 'react';
import { PairState, Direction, RiskPlan } from '../types';
import { InfoIcon, ArrowLeftIcon, ArrowUpIcon, ArrowDownIcon, CalculatorIcon } from './icons';
import { CURRENCY_PAIRS } from '../constants';
import AlertMessage from './AlertMessage';
import { currencyService, ExchangeRates } from '../src/services/currencyService';

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
    <div className="flex items-center bg-tc-bg-secondary rounded-full p-1">
        <button
            onClick={() => onChangeDirection(Direction.LONG)}
            className={`flex-1 rounded-full transition-colors flex justify-center items-center gap-2 text-sm font-semibold py-3 ${direction === Direction.LONG ? 'bg-tc-success text-white shadow-sm' : 'text-tc-text-secondary hover:bg-tc-bg-tertiary'}`}
        >
            <ArrowUpIcon className="w-4 h-4" /> COMPRA
        </button>
        <button
            onClick={() => onChangeDirection(Direction.SHORT)}
            className={`flex-1 rounded-full transition-colors flex justify-center items-center gap-2 text-sm font-semibold py-3 ${direction === Direction.SHORT ? 'bg-tc-error text-white shadow-sm' : 'text-tc-text-secondary hover:bg-tc-bg-tertiary'}`}
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

    const [riskPercentage, setRiskPercentage] = useState(String(recommendedRisk));
    const [rates, setRates] = useState<ExchangeRates | null>(null);

    useEffect(() => {
        setRiskPercentage(String(recommendedRisk));
    }, [recommendedRisk]);

    useEffect(() => {
        const fetchRates = async () => {
            const data = await currencyService.getLatestRates();
            setRates(data);
        };
        fetchRates();
    }, []);

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
            } else if (rates) {
                // CROSS PAIR CALCULATION (e.g. EURGBP)
                // Risk is in GBP (Quote). We need GBP/USD rate to convert risk to Account Currency (USD).
                const quoteToUsdRate = rates[quoteCurrency];
                if (quoteToUsdRate) {
                    // exchangerate-api uses USD as base, so rates["GBP"] is USD/GBP? 
                    // No, typically it's 1 USD = X GBP.
                    // So result = amount (GBP) / rate (USD/GBP)
                    riskPerUnitInAccountCurrency = riskPerUnitInQuoteCurrency / quoteToUsdRate;
                } else {
                    riskPerUnitInAccountCurrency = riskPerUnitInQuoteCurrency;
                }
            } else {
                // FALLBACK: Use quote currency risk (1:1 assumption) but WARN user.
                console.warn("Cross pair detected without exchange rate. Using fallback calculation.");
                setRiskWarning("Par cruzado: Cálculo aproximado (esperando tasas...).");
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
            } else if (rates) {
                // CROSS PAIR: Pip value is in Quote Currency. Convert to USD.
                const quoteToUsdRate = rates[quoteCurrency];
                if (quoteToUsdRate) {
                    pipValueInUSD = (pipDecimal * units) / quoteToUsdRate;
                } else {
                    pipValueInUSD = null;
                }
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

    const directionColor = direction === Direction.LONG ? 'text-tc-success' : 'text-tc-error';
    const directionText = direction === Direction.LONG ? 'COMPRA' : 'VENTA';

    return (
        <div className="p-4 sm:p-6 max-w-4xl mx-auto animate-fade-in pb-24">
            {isCalculatorMode ? (
                <div className="flex items-center mb-6">
                    <CalculatorIcon className="w-8 h-8 sm:w-10 sm:h-10 text-tc-growth-green mr-4" />
                    <h1 className="text-xl font-semibold text-tc-text">Calculadora</h1>
                </div>
            ) : (
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                        <button onClick={onBack} aria-label="Volver" className="bg-tc-bg border border-tc-border-light text-tc-text p-2 rounded-full hover:bg-tc-bg-secondary transition-colors">
                            <ArrowLeftIcon className="w-6 h-6" />
                        </button>
                        <div>
                            <h1 className="text-xl font-semibold text-tc-text">Gestión del Riesgo</h1>
                            <p className="text-sm font-medium text-tc-text-secondary">{symbol} &bull; <span className={directionColor}>{directionText}</span></p>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Column 1: Inputs */}
                <div className="bg-tc-bg p-6 rounded-3xl border border-tc-border-light shadow-sm space-y-5">
                    <h3 className="text-lg font-semibold text-tc-text pb-2">Parámetros</h3>
                    {isCalculatorMode && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-tc-text-secondary mb-1 uppercase tracking-widest">Símbolo</label>
                                <div className="relative">
                                    <select value={internalSymbol} onChange={e => setInternalSymbol(e.target.value)} className="w-full bg-tc-bg-secondary border-b border-tc-border-medium rounded-t-lg px-4 py-3 text-tc-text focus:border-tc-growth-green outline-none appearance-none transition-colors text-base">
                                        {CURRENCY_PAIRS.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-tc-text-secondary">
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
                        <Input label="Riesgo (%)" type="number" value={riskPercentage} onChange={e => setRiskPercentage(e.target.value)} step="0.01" className="font-bold text-tc-growth-green !bg-tc-bg-secondary" />
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
                <div className="bg-tc-bg-secondary/30 backdrop-blur-sm p-6 sm:p-8 rounded-[2rem] border border-tc-border-light shadow-sm space-y-6 flex flex-col relative overflow-hidden group">
                    {/* Decorative background jewelry */}
                    <div className="absolute -right-4 -top-4 w-32 h-32 bg-tc-growth-green/5 rounded-full blur-3xl group-hover:bg-tc-growth-green/10 transition-colors duration-700" />

                    <h3 className="text-lg font-bold text-tc-text tracking-tight uppercase text-[11px] opacity-60 flex items-center gap-2 relative z-10">
                        <span className="w-1.5 h-1.5 rounded-full bg-tc-growth-green" />
                        Resultados Estimados
                    </h3>

                    {priceLogicError && <AlertMessage type="error" text={priceLogicError} />}

                    <div className={`space-y-5 relative z-10 ${priceLogicError ? 'opacity-50 grayscale' : ''}`}>
                        <div className="grid grid-cols-2 gap-4">
                            <CalculatedField label="Pérdida Máx" value={potentialLoss ? `-$${potentialLoss.toFixed(2)}` : '---'} isLoss />
                            <CalculatedField label="Ganancia Est" value={potentialProfit ? `+$${potentialProfit.toFixed(2)}` : '---'} isGain />
                        </div>
                        <div className="relative">
                            <CalculatedField label="Ratio Riesgo/Beneficio" value={riskRewardRatio ? `1 : ${riskRewardRatio.toFixed(2)}` : '---'} hasError={!!rrError} large />
                            {rrError && <div className="mt-2"><AlertMessage type="error" text={rrError} size="small" /></div>}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <CalculatedField label="Tamaño Pos (Lots)" value={positionSize ? positionSize.toFixed(2) : '---'} />
                            <CalculatedField label="Valor por Pip" value={pipValue ? `$${pipValue.toFixed(2)}` : '---'} />
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
                        className="w-full sm:w-auto sm:min-w-[240px] bg-tc-growth-green hover:bg-tc-growth-green-light active:bg-tc-growth-green-dark text-white text-sm font-semibold py-4 px-12 rounded-full shadow-xl transition-all active:scale-95 disabled:bg-tc-bg-secondary disabled:text-tc-text-tertiary disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        Ejecutar
                    </button>
                </div>
            )}
        </div>
    );
};

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, ...props }) => (
    <div className="relative group/input">
        <label className="block text-[10px] font-bold text-tc-text-secondary/60 mb-1.5 uppercase tracking-widest pl-1">{label}</label>
        <div className="relative">
            <input
                {...props}
                className={`w-full bg-tc-bg-secondary/40 backdrop-blur-sm border-2 border-transparent rounded-2xl px-5 py-4 text-tc-text text-base font-data font-semibold focus:border-tc-growth-green/50 focus:bg-tc-bg shadow-inner-sm outline-none transition-all duration-300 placeholder:text-tc-text-tertiary group-hover/input:border-tc-border-medium ${props.readOnly ? 'cursor-default' : ''} ${props.className}`}
            />
        </div>
    </div>
);

const CalculatedField: React.FC<{ label: string, value: string, hasError?: boolean, isGain?: boolean, isLoss?: boolean, large?: boolean }> = ({ label, value, hasError, isGain, isLoss, large }) => {
    let colorClass = 'text-tc-text';
    let bgClass = 'bg-tc-bg-secondary/30';
    let borderClass = 'border-tc-border-light';

    if (isGain) {
        colorClass = 'text-tc-success';
        bgClass = 'bg-tc-success/[0.03]';
        borderClass = 'border-tc-success/10';
    }
    if (isLoss) {
        colorClass = 'text-tc-error';
        bgClass = 'bg-tc-error/[0.03]';
        borderClass = 'border-tc-error/10';
    }
    if (large) {
        colorClass = 'text-tc-growth-green';
        bgClass = 'bg-tc-growth-green/[0.03]';
        borderClass = 'border-tc-growth-green/20';
    }

    return (
        <div className={`relative overflow-hidden ${bgClass} rounded-2xl p-4 sm:p-5 border ${borderClass} flex flex-col justify-center items-center transition-all duration-300 group/field hover:shadow-sm ${hasError ? 'ring-2 ring-tc-error bg-tc-error/5 border-tc-error' : ''}`}>
            <span className="text-[10px] font-bold text-tc-text-secondary/60 uppercase tracking-widest mb-1.5 relative z-10">{label}</span>
            <span className={`font-data font-bold ${large ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'} ${colorClass} tracking-tighter relative z-10`}>
                {value}
            </span>

            {/* Jewel highlight */}
            <div className={`absolute -right-2 -bottom-2 w-8 h-8 rounded-full blur-lg opacity-0 group-hover/field:opacity-40 transition-opacity duration-700 ${bgClass}`} />
        </div>
    );
};

export default RiskManagementScreen;