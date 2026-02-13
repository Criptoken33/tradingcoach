import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Trade, OperationStatus, Direction } from '../types';
import { EXIT_REASONS } from '../constants';
import { JournalIcon, XCircleIcon, InfoIcon, CheckCircleIcon } from './icons';
import { useProFeatures } from '../src/hooks/useProFeatures';

interface TradingLogProps {
    tradingLog: Trade[];
    onAddNote: (tradeId: string, note: string) => void;
    onCloseTrade: (tradeId: string, exitPrice: number, exitReason: string) => void;
}

const TradingLog: React.FC<TradingLogProps> = ({ tradingLog, onAddNote, onCloseTrade }) => {
    const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
    const pro = useProFeatures();

    // Sort trades from newest to oldest
    const sortedTradingLog = [...tradingLog].sort((a, b) => (b.openTimestamp) - (a.openTimestamp));

    return (
        <>
            <div className="p-4 sm:p-8 max-w-6xl mx-auto animate-fade-in pb-24">
                <div className="flex items-center mb-8">
                    <JournalIcon className="w-10 h-10 text-tc-growth-green mr-4" />
                    <h1 className="text-xl font-semibold text-tc-text">Diario de Operaciones</h1>
                </div>

                {sortedTradingLog.length === 0 ? (
                    <div className="text-center py-20 px-8 bg-tc-bg-secondary/20 rounded-[2.5rem] border border-dashed border-tc-border-medium animate-in fade-in zoom-in-95 duration-700">
                        <div className="w-20 h-20 bg-tc-bg rounded-3xl shadow-sm border border-tc-border-light flex items-center justify-center mx-auto mb-6">
                            <JournalIcon className="w-10 h-10 text-tc-text-tertiary" />
                        </div>
                        <h3 className="text-xl font-semibold text-tc-text mb-2">Tu diario está esperando</h3>
                        <p className="text-tc-text-secondary text-sm max-w-xs mx-auto">
                            Cada operación es una lección. Registra tu primera entrada para empezar a construir tu ventaja estadística.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {sortedTradingLog.map(trade => (
                            <TradeCard
                                key={trade.id}
                                trade={trade}
                                onViewDetails={() => setSelectedTrade(trade)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {selectedTrade && createPortal(
                <TradeDetailModal
                    trade={selectedTrade}
                    onClose={() => setSelectedTrade(null)}
                    onAddNote={onAddNote}
                    onCloseTrade={onCloseTrade}
                    isPro={pro.isPro}
                />,
                document.body
            )}
        </>
    );
};

const calculatePnl = (trade: Trade) => {
    if (trade.status !== OperationStatus.CLOSED || !trade.riskPlan || !trade.exitPrice) return null;

    const { entryPrice, positionSizeLots } = trade.riskPlan;
    if (!entryPrice || !positionSizeLots) return null;

    const pipMultiplier = trade.symbol.includes('JPY') ? 100 : 10000;
    const pips = (trade.direction === Direction.LONG ? trade.exitPrice - entryPrice : entryPrice - trade.exitPrice) * pipMultiplier;

    const pipValuePerLot = 10;
    const profit = pips * pipValuePerLot * positionSizeLots;

    return { profit, pips };
}

interface TradeCardProps {
    trade: Trade;
    onViewDetails: () => void;
}

const TradeCard: React.FC<TradeCardProps> = ({ trade, onViewDetails }) => {
    const pnl = calculatePnl(trade);

    const getDisplayInfo = () => {
        if (trade.status === OperationStatus.OPEN) {
            return {
                Icon: InfoIcon,
                iconBgColor: 'bg-tc-warning',
                pnlText: 'Abierta',
                pnlColor: 'text-tc-text-secondary',
            };
        }
        if (pnl) {
            const isWin = pnl.profit >= 0;
            return {
                Icon: isWin ? CheckCircleIcon : XCircleIcon,
                iconBgColor: isWin ? 'bg-tc-success' : 'bg-tc-error',
                pnlText: `${isWin ? '+' : ''}${pnl.profit.toFixed(2)}`,
                pnlColor: isWin ? 'text-tc-success' : 'text-tc-error',
            };
        }
        // Fallback for closed trades with no PNL data (should not happen)
        return {
            Icon: InfoIcon,
            iconBgColor: 'bg-tc-border-medium',
            pnlText: 'Cerrada',
            pnlColor: 'text-tc-text-secondary',
        };
    };

    const { Icon, iconBgColor, pnlText, pnlColor } = getDisplayInfo();

    return (
        <div onClick={onViewDetails} className="bg-tc-bg rounded-3xl p-4 shadow-sm flex justify-between items-center gap-3 cursor-pointer hover:bg-tc-bg-secondary transition-colors border border-transparent hover:border-tc-border-medium">
            <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${iconBgColor}`}>
                    <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                    <h2 className="font-data font-semibold text-tc-text truncate">{trade.symbol}</h2>
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${trade.direction === Direction.LONG ? 'text-tc-success' : 'text-tc-error'}`}>
                        {trade.direction}
                    </span>
                </div>
            </div>
            <div className={`font-data font-bold text-lg ${pnlColor} ml-2`}>
                {pnlText}
            </div>
        </div>
    );
};

interface TradeDetailModalProps {
    trade: Trade;
    onClose: () => void;
    onAddNote: (tradeId: string, note: string) => void;
    onCloseTrade: (tradeId: string, exitPrice: number, exitReason: string) => void;
    isPro: boolean;
}

const TradeDetailModal: React.FC<TradeDetailModalProps> = ({ trade, onClose, onAddNote, onCloseTrade, isPro }) => {
    const [note, setNote] = useState('');
    const [exitPrice, setExitPrice] = useState('');
    const [exitReason, setExitReason] = useState(EXIT_REASONS[0]);
    const [exitPriceWarning, setExitPriceWarning] = useState<string | null>(null);

    useEffect(() => {
        if (exitReason === EXIT_REASONS[0]) {
            if (trade.riskPlan?.takeProfitPrice) setExitPrice(String(trade.riskPlan.takeProfitPrice));
        } else if (exitReason === EXIT_REASONS[1]) {
            if (trade.riskPlan?.stopLossPrice) setExitPrice(String(trade.riskPlan.stopLossPrice));
        } else {
            setExitPrice('');
        }
    }, [exitReason, trade.riskPlan]);

    useEffect(() => {
        const price = parseFloat(exitPrice);
        const sl = trade.riskPlan?.stopLossPrice;
        if (!price || !sl) {
            setExitPriceWarning(null);
            return;
        }

        if (trade.direction === Direction.LONG && price < sl) {
            setExitPriceWarning('Precio salida peor que SL.');
        } else if (trade.direction === Direction.SHORT && price > sl) {
            setExitPriceWarning('Precio salida peor que SL.');
        } else {
            setExitPriceWarning(null);
        }
    }, [exitPrice, trade.direction, trade.riskPlan?.stopLossPrice]);


    const handleAddNote = () => {
        if (note.trim()) {
            onAddNote(trade.id, note.trim());
            setNote('');
        }
    };

    const handleCloseTrade = () => {
        const price = parseFloat(exitPrice);
        if (price > 0 && exitReason) {
            onCloseTrade(trade.id, price, exitReason);
            onClose();
        }
    };

    const pnl = calculatePnl(trade);

    const getStatusInfo = () => {
        switch (trade.status) {
            case OperationStatus.OPEN: return { text: 'Abierta', color: 'bg-tc-warning text-white' };
            case OperationStatus.CLOSED: return { text: 'Cerrada', color: pnl && pnl.profit >= 0 ? 'bg-tc-success' : 'bg-tc-error' };
            default: return { text: 'Desconocido', color: 'bg-slate-500' };
        }
    };

    const statusInfo = getStatusInfo();
    const { riskPlan } = trade;
    if (!riskPlan) return null;

    const isPriceLocked = exitReason === EXIT_REASONS[0] || exitReason === EXIT_REASONS[1];

    return (
        <div className={`fixed inset-0 bg-tc-bg z-[100] animate-fade-in-up flex flex-col h-[100dvh] ${!isPro ? 'pt-[60px]' : ''}`}>

            {/* Header */}
            <div className="p-6 border-b border-tc-border-light flex-none flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-xl font-semibold text-tc-text">{trade.symbol}</h2>
                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full ${trade.direction === Direction.LONG ? 'bg-tc-success/10 text-tc-success' : 'bg-tc-error/10 text-tc-error'}`}>
                            {trade.direction === Direction.LONG ? 'Long' : 'Short'}
                        </span>
                        {trade.status === OperationStatus.CLOSED && (
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${statusInfo.color}`}>{statusInfo.text}</span>
                        )}
                    </div>
                    {pnl && (
                        <div className={`font-data font-bold text-lg ${pnl.profit >= 0 ? 'text-tc-success' : 'text-tc-error'}`}>
                            {pnl.profit > 0 ? '+' : ''}{pnl.profit.toFixed(2)} USD
                        </div>
                    )}
                </div>
                <button onClick={onClose} className="p-2 bg-tc-border-light rounded-full hover:bg-tc-border-medium text-tc-text-secondary transition-colors">
                    <XCircleIcon className="w-6 h-6" />
                </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1 min-h-0">
                <div className="bg-tc-bg-secondary rounded-2xl border border-tc-border-light grid grid-cols-2">
                    <div className="p-4 border-r border-b border-tc-border-light">
                        <label className="block text-[10px] font-bold text-tc-text-secondary uppercase tracking-wider mb-1">Entrada</label>
                        <p className="text-tc-text font-data font-bold">{riskPlan.entryPrice?.toFixed(5) ?? '---'}</p>
                    </div>
                    <div className="p-4 border-b border-tc-border-light">
                        <label className="block text-[10px] font-bold text-tc-text-secondary uppercase tracking-wider mb-1">Lotes</label>
                        <p className="text-tc-text font-data font-bold">{riskPlan.positionSizeLots?.toFixed(2) ?? '---'}</p>
                    </div>
                    <div className="p-4 border-r border-tc-border-light">
                        <label className="block text-[10px] font-bold text-tc-text-secondary uppercase tracking-wider mb-1">Stop Loss</label>
                        <p className="text-tc-text font-data font-bold">{riskPlan.stopLossPrice?.toFixed(5) ?? '---'}</p>
                    </div>
                    <div className="p-4">
                        <label className="block text-[10px] font-bold text-tc-text-secondary uppercase tracking-wider mb-1">Take Profit</label>
                        <p className="text-tc-text font-data font-bold">{riskPlan.takeProfitPrice?.toFixed(5) ?? '---'}</p>
                    </div>
                </div>

                <div>
                    <h3 className="text-xs font-semibold text-tc-text uppercase tracking-wider mb-3">Notas</h3>
                    <div className="space-y-2 mb-4">
                        {trade.notes.length > 0 ? trade.notes.map((n, i) => (
                            <div key={i} className="bg-tc-bg-secondary p-4 rounded-2xl text-sm text-tc-text border border-tc-border-light">{n}</div>
                        )) : <p className="text-sm text-tc-text-secondary italic">Sin notas.</p>}
                    </div>

                    {trade.status === OperationStatus.OPEN && (
                        <div className="flex gap-2">
                            <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="Nueva nota..." className="flex-grow bg-tc-bg-secondary border-b-2 border-tc-border-medium rounded-t-lg px-4 py-2 text-tc-text outline-none focus:border-tc-growth-green text-sm" />
                            <button onClick={handleAddNote} className="bg-tc-bg-secondary text-tc-text text-sm font-medium py-2 px-4 rounded-xl hover:bg-tc-bg-tertiary transition-colors">Enviar</button>
                        </div>
                    )}
                </div>

                {trade.status === OperationStatus.OPEN && (
                    <div className="bg-tc-bg-secondary p-4 rounded-3xl border border-tc-border-light">
                        <h3 className="text-xs font-semibold text-tc-error uppercase tracking-wider mb-4">Cerrar Operación</h3>
                        <div className="space-y-4">
                            <Input
                                label="Precio de Salida"
                                type="number"
                                value={exitPrice}
                                onChange={e => setExitPrice(e.target.value)}
                                placeholder="0.00000"
                                disabled={isPriceLocked}
                                readOnly={isPriceLocked}
                            />
                            <div>
                                <label className="block text-[10px] font-bold text-tc-text-secondary mb-1 uppercase tracking-widest">Razón</label>
                                <select value={exitReason} onChange={e => setExitReason(e.target.value)} className="w-full bg-tc-bg-secondary border-b-2 border-tc-border-medium rounded-t-lg px-4 py-3 text-tc-text outline-none appearance-none text-base">
                                    {EXIT_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>

                            {exitPriceWarning && (
                                <div className="text-[10px] text-tc-warning font-bold flex items-center gap-1 uppercase tracking-widest">
                                    <InfoIcon className="w-4 h-4" /> {exitPriceWarning}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer for close button */}
            {trade.status === OperationStatus.OPEN && (
                <div className="p-4 sm:p-6 border-t border-tc-border-light shadow-[0_-4px_10px_-5px_rgba(0,0,0,0.1)] bg-tc-bg flex-none">
                    <button onClick={handleCloseTrade} disabled={!exitPrice} className="w-full bg-tc-error hover:bg-tc-error/90 active:bg-tc-error text-white text-sm font-semibold py-4 px-4 rounded-2xl shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:shadow-none">
                        Confirmar Cierre
                    </button>
                </div>
            )}
        </div>
    );
};

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, ...props }) => (
    <div>
        <label className="block text-[10px] font-bold text-tc-text-secondary mb-1 uppercase tracking-widest">{label}</label>
        <input
            {...props}
            className={`w-full bg-tc-bg-secondary border-b-2 border-tc-border-medium rounded-t-lg px-4 py-3 text-tc-text outline-none focus:border-tc-growth-green transition-colors text-base ${props.readOnly ? 'opacity-70' : ''}`}
        />
    </div>
);

export default TradingLog;