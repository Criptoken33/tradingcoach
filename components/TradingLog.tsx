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
                    <JournalIcon className="w-10 h-10 text-brand-accent mr-4" />
                    <h1 className="text-3xl font-bold text-brand-text">Diario de Operaciones</h1>
                </div>

                {sortedTradingLog.length === 0 ? (
                    <div className="text-center py-16 bg-brand-light rounded-3xl border border-brand-border-secondary/50">
                        <p className="text-brand-text-secondary text-lg">No hay operaciones registradas.</p>
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
                iconBgColor: 'bg-brand-warning-medium',
                pnlText: 'Abierta',
                pnlColor: 'text-brand-text-secondary',
            };
        }
        if (pnl) {
            const isWin = pnl.profit >= 0;
            return {
                Icon: isWin ? CheckCircleIcon : XCircleIcon,
                iconBgColor: isWin ? 'bg-brand-success' : 'bg-brand-danger',
                pnlText: `${isWin ? '+' : ''}${pnl.profit.toFixed(2)}`,
                pnlColor: isWin ? 'text-brand-success' : 'text-brand-danger',
            };
        }
        // Fallback for closed trades with no PNL data (should not happen)
        return {
            Icon: InfoIcon,
            iconBgColor: 'bg-brand-border',
            pnlText: 'Cerrada',
            pnlColor: 'text-brand-text-secondary',
        };
    };

    const { Icon, iconBgColor, pnlText, pnlColor } = getDisplayInfo();

    return (
        <div onClick={onViewDetails} className="bg-brand-light rounded-3xl p-4 shadow-sm flex justify-between items-center gap-3 cursor-pointer hover:bg-brand-tertiary/50 transition-colors border border-transparent hover:border-brand-border-secondary">
            <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${iconBgColor}`}>
                    <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                    <h2 className="text-base font-bold text-brand-text truncate">{trade.symbol}</h2>
                    <span className={`text-xs font-bold uppercase tracking-wide ${trade.direction === Direction.LONG ? 'text-brand-success' : 'text-brand-danger'}`}>
                        {trade.direction}
                    </span>
                </div>
            </div>
            <div className={`font-mono font-bold text-lg ${pnlColor} ml-2`}>
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
            case OperationStatus.OPEN: return { text: 'Abierta', color: 'bg-brand-warning-medium text-black' };
            case OperationStatus.CLOSED: return { text: 'Cerrada', color: pnl && pnl.profit >= 0 ? 'bg-brand-success' : 'bg-brand-danger' };
            default: return { text: 'Desconocido', color: 'bg-slate-500' };
        }
    };

    const statusInfo = getStatusInfo();
    const { riskPlan } = trade;
    if (!riskPlan) return null;

    const isPriceLocked = exitReason === EXIT_REASONS[0] || exitReason === EXIT_REASONS[1];

    return (
        <div className={`fixed inset-0 bg-brand-light z-[100] animate-fade-in-up flex flex-col h-[100dvh] ${!isPro ? 'pt-[60px]' : ''}`}>

            {/* Header */}
            <div className="p-6 border-b border-brand-border-secondary flex-none flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-2xl font-bold text-brand-text">{trade.symbol}</h2>
                        <span className={`px-2 py-0.5 text-xs font-bold uppercase rounded-full ${trade.direction === Direction.LONG ? 'bg-brand-success/10 text-brand-success' : 'bg-brand-danger/10 text-brand-danger'}`}>
                            {trade.direction === Direction.LONG ? 'Long' : 'Short'}
                        </span>
                        {trade.status === OperationStatus.CLOSED && (
                            <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${statusInfo.color}`}>{statusInfo.text}</span>
                        )}
                    </div>
                    {pnl && (
                        <div className={`text-xl font-mono font-bold ${pnl.profit >= 0 ? 'text-brand-success' : 'text-brand-danger'}`}>
                            {pnl.profit > 0 ? '+' : ''}{pnl.profit.toFixed(2)} USD
                        </div>
                    )}
                </div>
                <button onClick={onClose} className="p-2 bg-brand-border/20 rounded-full hover:bg-brand-border/50 text-brand-text-secondary transition-colors">
                    <XCircleIcon className="w-6 h-6" />
                </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1 min-h-0">
                <div className="bg-brand-tertiary/20 rounded-2xl border border-brand-border-secondary/30 grid grid-cols-2">
                    <div className="p-4 border-r border-b border-brand-border-secondary/30">
                        <label className="block text-xs font-bold text-brand-text-secondary uppercase tracking-wider mb-1">Entrada</label>
                        <p className="text-brand-text font-mono font-bold text-lg">{riskPlan.entryPrice?.toFixed(5) ?? '---'}</p>
                    </div>
                    <div className="p-4 border-b border-brand-border-secondary/30">
                        <label className="block text-xs font-bold text-brand-text-secondary uppercase tracking-wider mb-1">Lotes</label>
                        <p className="text-brand-text font-mono font-bold text-lg">{riskPlan.positionSizeLots?.toFixed(2) ?? '---'}</p>
                    </div>
                    <div className="p-4 border-r border-brand-border-secondary/30">
                        <label className="block text-xs font-bold text-brand-text-secondary uppercase tracking-wider mb-1">Stop Loss</label>
                        <p className="text-brand-text font-mono font-bold text-lg">{riskPlan.stopLossPrice?.toFixed(5) ?? '---'}</p>
                    </div>
                    <div className="p-4">
                        <label className="block text-xs font-bold text-brand-text-secondary uppercase tracking-wider mb-1">Take Profit</label>
                        <p className="text-brand-text font-mono font-bold text-lg">{riskPlan.takeProfitPrice?.toFixed(5) ?? '---'}</p>
                    </div>
                </div>

                <div>
                    <h3 className="text-sm font-bold text-brand-text uppercase tracking-wider mb-3">Notas</h3>
                    <div className="space-y-2 mb-4">
                        {trade.notes.length > 0 ? trade.notes.map((n, i) => (
                            <div key={i} className="bg-brand-tertiary/30 p-4 rounded-2xl text-sm text-brand-text border border-brand-border-secondary/50">{n}</div>
                        )) : <p className="text-sm text-brand-text-secondary italic">Sin notas.</p>}
                    </div>

                    {trade.status === OperationStatus.OPEN && (
                        <div className="flex gap-2">
                            <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="Nueva nota..." className="flex-grow bg-brand-tertiary/30 border-b-2 border-brand-border-secondary rounded-t-lg px-4 py-2 text-brand-text outline-none focus:border-brand-accent" />
                            <button onClick={handleAddNote} className="bg-brand-tertiary text-brand-text font-bold py-2 px-4 rounded-xl">Enviar</button>
                        </div>
                    )}
                </div>

                {trade.status === OperationStatus.OPEN && (
                    <div className="bg-brand-tertiary/20 p-4 rounded-3xl border border-brand-border-secondary/50">
                        <h3 className="text-sm font-bold text-brand-danger uppercase tracking-wider mb-4">Cerrar Operación</h3>
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
                                <label className="block text-xs font-bold text-brand-text-secondary mb-1 uppercase tracking-wider">Razón</label>
                                <select value={exitReason} onChange={e => setExitReason(e.target.value)} className="w-full bg-brand-tertiary/50 border-b-2 border-brand-text-secondary rounded-t-lg px-4 py-3 text-brand-text outline-none appearance-none">
                                    {EXIT_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>

                            {exitPriceWarning && (
                                <div className="text-xs text-brand-warning-high font-bold flex items-center gap-1">
                                    <InfoIcon className="w-4 h-4" /> {exitPriceWarning}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer for close button */}
            {trade.status === OperationStatus.OPEN && (
                <div className="p-4 sm:p-6 border-t border-brand-border-secondary/50 shadow-[0_-4px_10px_-5px_rgba(0,0,0,0.1)] bg-brand-light flex-none">
                    <button onClick={handleCloseTrade} disabled={!exitPrice} className="w-full bg-brand-danger text-white font-bold py-4 px-4 rounded-2xl shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:shadow-none">
                        Confirmar Cierre
                    </button>
                </div>
            )}
        </div>
    );
};

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, ...props }) => (
    <div>
        <label className="block text-xs font-bold text-brand-text-secondary mb-1 uppercase tracking-wider">{label}</label>
        <input
            {...props}
            className={`w-full bg-brand-tertiary/50 border-b-2 border-brand-text-secondary rounded-t-lg px-4 py-3 text-brand-text outline-none focus:border-brand-accent transition-colors ${props.readOnly ? 'opacity-70' : ''}`}
        />
    </div>
);

export default TradingLog;