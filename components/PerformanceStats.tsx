import React, { useMemo, useState } from 'react';
import { Trade, OperationStatus, Direction, MT5ReportData, MT5Summary } from '../types';
import { ChartPieIcon, InfoIcon } from './icons';

// Helper function to calculate PnL from in-app log
const calculateInAppPnl = (trade: Trade): number | null => {
    if (
        trade.status !== OperationStatus.CLOSED ||
        !trade.riskPlan ||
        !trade.exitPrice ||
        !trade.riskPlan.entryPrice ||
        !trade.riskPlan.positionSizeLots
    ) {
        return null;
    }
    const { entryPrice, positionSizeLots } = trade.riskPlan;
    const pipMultiplier = trade.symbol.includes('JPY') ? 100 : 10000;
    const pips = (trade.direction === Direction.LONG ? trade.exitPrice - entryPrice : entryPrice - trade.exitPrice) * pipMultiplier;
    const pipValuePerLot = 10; // Assuming standard lot on a USD account
    return pips * pipValuePerLot * positionSizeLots;
};

// Generates a full performance report from the in-app trading log
const calculateStatsFromLog = (trades: (Trade & { pnl: number })[], initialBalance: number): MT5ReportData => {
    const sortedTrades = [...trades].sort((a, b) => a.closeTimestamp! - b.closeTimestamp!);

    let grossProfit = 0;
    let grossLoss = 0;
    let maxConsecutiveWins = 0;
    let maxConsecutiveLosses = 0;
    let currentWinStreak = 0;
    let currentLossStreak = 0;

    sortedTrades.forEach(trade => {
        const pnl = trade.pnl;
        if (pnl > 0) {
            grossProfit += pnl;
            currentWinStreak++;
            currentLossStreak = 0;
        } else if (pnl < 0) {
            grossLoss += pnl;
            currentLossStreak++;
            currentWinStreak = 0;
        }
        if (currentWinStreak > maxConsecutiveWins) maxConsecutiveWins = currentWinStreak;
        if (currentLossStreak > maxConsecutiveLosses) maxConsecutiveLosses = currentLossStreak;
    });

    const totalNetProfit = grossProfit + grossLoss;
    const profitFactor = grossLoss !== 0 ? Math.abs(grossProfit / grossLoss) : 0;
    const winningTrades = sortedTrades.filter(t => t.pnl > 0);
    const losingTrades = sortedTrades.filter(t => t.pnl < 0);
    const averageProfitTrade = winningTrades.length > 0 ? grossProfit / winningTrades.length : 0;
    const averageLossTrade = losingTrades.length > 0 ? grossLoss / losingTrades.length : 0;

    // Equity Curve & Max Drawdown Calculation
    const equityCurve: { time: number; balance: number }[] = [];
    let currentBalance = initialBalance;
    let peakEquity = initialBalance;
    let maxDrawdownPercent = 0;

    sortedTrades.forEach(trade => {
        currentBalance += trade.pnl;
        equityCurve.push({ time: trade.closeTimestamp!, balance: currentBalance });
        if (currentBalance > peakEquity) {
            peakEquity = currentBalance;
        }
        if (peakEquity > 0) {
            const drawdownPercent = ((peakEquity - currentBalance) / peakEquity) * 100;
            if (drawdownPercent > maxDrawdownPercent) {
                maxDrawdownPercent = drawdownPercent;
            }
        }
    });

    // Performance by Category
    const perfBySymbol: { [key: string]: number } = {};
    const perfByDirection: { [key: string]: number } = { [Direction.LONG]: 0, [Direction.SHORT]: 0 };
    const perfByDay: { [key: string]: number } = {};
    const monthlyPerf: { [key: string]: { year: number, monthName: string, pnl: number } } = {};

    const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    sortedTrades.forEach(trade => {
        const date = new Date(trade.closeTimestamp!);
        perfBySymbol[trade.symbol] = (perfBySymbol[trade.symbol] || 0) + trade.pnl;
        perfByDirection[trade.direction] += trade.pnl;
        const dayName = dayNames[date.getDay()];
        perfByDay[dayName] = (perfByDay[dayName] || 0) + trade.pnl;
        const year = date.getFullYear();
        const monthIndex = date.getMonth();
        const monthKey = `${year}-${monthIndex}`;
        if (!monthlyPerf[monthKey]) {
            monthlyPerf[monthKey] = { year, monthName: monthNames[monthIndex], pnl: 0 };
        }
        monthlyPerf[monthKey].pnl += trade.pnl;
    });

    const monthlyPerformanceByYear: { [year: number]: { name: string, pnl: number }[] } = {};
    Object.values(monthlyPerf).forEach(m => {
        if (!monthlyPerformanceByYear[m.year]) monthlyPerformanceByYear[m.year] = [];
        monthlyPerformanceByYear[m.year].push({ name: m.monthName, pnl: m.pnl });
    });

    const summary: MT5Summary = {
        grossProfit,
        grossLoss,
        profitFactor,
        totalNetProfit,
        maxDrawdown: maxDrawdownPercent,
        totalTrades: sortedTrades.length,
        averageProfitTrade,
        averageLossTrade,
        maxConsecutiveWins,
        maxConsecutiveLosses,
        bestTrade: sortedTrades.length > 0 ? Math.max(0, ...sortedTrades.map(t => t.pnl)) : 0,
        worstTrade: sortedTrades.length > 0 ? Math.min(0, ...sortedTrades.map(t => t.pnl)) : 0,
    };

    return {
        summary,
        trades: [],
        monthlyPerformance: Object.entries(monthlyPerformanceByYear).map(([year, months]) => ({ year: parseInt(year), months })),
        equityCurve,
        performanceBySymbol: Object.entries(perfBySymbol).map(([label, value]) => ({ label, value })),
        performanceByDirection: Object.entries(perfByDirection).map(([label, value]) => ({ label: label as Direction, value })),
        performanceByDay: Object.entries(perfByDay).map(([label, value]) => ({ label, value })),
    };
}

const formatDuration = (ms: number): string => {
    if (!isFinite(ms) || ms <= 0) return '0s';

    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
};

interface PerformanceStatsProps {
    tradingLog: Trade[];
    mt5ReportData: MT5ReportData | null;
    accountBalance: number;
}

type Tab = 'resumen' | 'graficos' | 'desglose';


const PerformanceStats: React.FC<PerformanceStatsProps> = ({ tradingLog, mt5ReportData, accountBalance }) => {
    const [activeTab, setActiveTab] = useState<Tab>('resumen');

    const closedInAppTrades = useMemo(() =>
        tradingLog
            .filter(t => t.status === OperationStatus.CLOSED && t.closeTimestamp)
            .map(t => ({ ...t, pnl: calculateInAppPnl(t) }))
            .filter(t => t.pnl !== null) as (Trade & { pnl: number })[],
        [tradingLog]
    );

    const reportData = useMemo(() => {
        // Priority 1: Use MT5 report and merge new trades from the app log
        if (mt5ReportData) {
            const mergedData: MT5ReportData = JSON.parse(JSON.stringify(mt5ReportData));
            const lastReportTime = mergedData.equityCurve.length > 0 ? mergedData.equityCurve[mergedData.equityCurve.length - 1].time : 0;

            const newTrades = closedInAppTrades.filter(t => t.closeTimestamp! > lastReportTime);
            if (newTrades.length === 0) return mergedData;

            newTrades.sort((a, b) => a.closeTimestamp! - b.closeTimestamp!);

            newTrades.forEach(trade => {
                const pnl = trade.pnl;
                mergedData.summary.totalNetProfit += pnl;
                mergedData.summary.totalTrades += 1;
                if (pnl > 0) mergedData.summary.grossProfit += pnl;
                else mergedData.summary.grossLoss += pnl; // Keep it negative
                if (pnl > mergedData.summary.bestTrade) mergedData.summary.bestTrade = pnl;
                if (pnl < mergedData.summary.worstTrade) mergedData.summary.worstTrade = pnl;
                mergedData.summary.profitFactor = mergedData.summary.grossLoss !== 0 ? Math.abs(mergedData.summary.grossProfit / mergedData.summary.grossLoss) : 0;
                const lastBalance = mergedData.equityCurve.length > 0 ? mergedData.equityCurve[mergedData.equityCurve.length - 1].balance : 0;
                mergedData.equityCurve.push({ time: trade.closeTimestamp!, balance: lastBalance + pnl });
                // Note: Merging chart data is complex and omitted for brevity. 
                // The core summary and equity curve are updated.
            });
            return mergedData;
        }

        // Priority 2: If no MT5 report, generate full stats from the app log
        if (closedInAppTrades.length > 0) {
            return calculateStatsFromLog(closedInAppTrades, accountBalance);
        }

        // No data available
        return null;
    }, [mt5ReportData, closedInAppTrades, accountBalance]);


    if (!reportData) {
        return (
            <div className="p-4 sm:p-8 max-w-6xl mx-auto animate-fade-in">
                <div className="flex items-center mb-8">
                    <ChartPieIcon className="w-10 h-10 text-brand-accent mr-4" />
                    <h1 className="headline-medium font-bold text-brand-text">Estadísticas de Rendimiento</h1>
                </div>
                <div className="text-center py-16 bg-brand-light rounded-3xl border border-brand-border-secondary/50">
                    <p className="text-brand-text-secondary title-medium font-semibold">No hay operaciones cerradas para analizar.</p>
                    <p className="text-brand-text-secondary mt-2 max-w-md mx-auto body-medium">Cierra una operación en el Diario o importa un reporte de MT5 desde Ajustes para empezar.</p>
                </div>
            </div>
        );
    }

    const { summary, monthlyPerformance, equityCurve, performanceBySymbol, performanceByDirection, performanceByDay } = reportData;

    const performanceByDayData = useMemo(() => {
        if (performanceByDay) {
            const dayOrder = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
            return [...performanceByDay]
                .filter(day => day.value !== 0)
                .sort((a, b) => dayOrder.indexOf(a.label) - dayOrder.indexOf(b.label));
        }
        return [];
    }, [performanceByDay]);

    // Calculate duration stats from in-app log only, as MT5 report doesn't have this detail.
    const winningTrades = closedInAppTrades.filter(t => t.pnl >= 0);
    const losingTrades = closedInAppTrades.filter(t => t.pnl < 0);

    const avgWinDurationMs = winningTrades.length > 0
        ? winningTrades.reduce((sum, t) => sum + (t.closeTimestamp! - t.openTimestamp), 0) / winningTrades.length
        : 0;

    const avgLossDurationMs = losingTrades.length > 0
        ? losingTrades.reduce((sum, t) => sum + (t.closeTimestamp! - t.openTimestamp), 0) / losingTrades.length
        : 0;

    const formattedAvgWinDuration = formatDuration(avgWinDurationMs);
    const formattedAvgLossDuration = formatDuration(avgLossDurationMs);
    const durationSentiment = avgWinDurationMs > avgLossDurationMs ? 'positive' : avgLossDurationMs > 0 ? 'negative' : undefined;

    const renderContent = () => {
        const maxLoss = Math.abs(summary.worstTrade);
        const avgWin = summary.averageProfitTrade;
        const mlAwRatio = avgWin > 0 ? maxLoss / avgWin : 0;

        let mlAwSentiment: 'positive' | 'warning' | 'negative' | undefined;
        if (mlAwRatio > 0) {
            if (mlAwRatio > 3.0) mlAwSentiment = 'negative';
            else if (mlAwRatio > 1.5) mlAwSentiment = 'warning';
            else mlAwSentiment = 'positive';
        }

        switch (activeTab) {
            case 'resumen':
                return (
                    <div className="animate-fade-in grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        <StatCard label="P/L Neto Total" value={`${summary.totalNetProfit.toFixed(2)} USD`} sentiment={summary.totalNetProfit >= 0 ? 'positive' : 'negative'} />
                        <StatCard label="Factor de Beneficio" value={summary.profitFactor.toFixed(2)} sentiment={summary.profitFactor > 1.5 ? 'positive' : summary.profitFactor > 1 ? 'warning' : 'negative'} />
                        <StatCard label="ML / AW" value={mlAwRatio > 0 ? `${mlAwRatio.toFixed(1)}x` : 'N/A'} sentiment={mlAwSentiment} description="Pérdida Máxima vs Ganancia Promedio" />
                        <StatCard
                            label="Duración Media W/L"
                            value={avgWinDurationMs > 0 || avgLossDurationMs > 0 ? `${formattedAvgWinDuration} / ${formattedAvgLossDuration}` : 'N/A'}
                            sentiment={durationSentiment}
                            description="Duración media de ganadoras vs. perdedoras. Idealmente, la duración de las ganadoras debe ser mayor."
                        />
                        <StatCard label="Drawdown Máximo" value={`${summary.maxDrawdown.toFixed(2)}%`} sentiment='negative' />
                        <StatCard label="Total Operaciones" value={String(summary.totalTrades)} />
                        <StatCard label="Ganancia Bruta" value={`+${summary.grossProfit.toFixed(2)}`} sentiment='positive' />
                        <StatCard label="Pérdida Bruta" value={`${summary.grossLoss.toFixed(2)}`} sentiment='negative' />
                        <StatCard label="Ganancia Promedio" value={summary.averageProfitTrade.toFixed(2)} sentiment='positive' />
                        <StatCard label="Pérdida Promedio" value={summary.averageLossTrade.toFixed(2)} sentiment='negative' />
                        <StatCard label="Mejor Operación" value={`+${summary.bestTrade.toFixed(2)}`} sentiment='positive' />
                        <StatCard label="Peor Operación" value={`${summary.worstTrade.toFixed(2)}`} sentiment='negative' />
                        <StatCard label="Victorias Consecutivas" value={String(summary.maxConsecutiveWins)} />
                        <StatCard label="Pérdidas Consecutivas" value={String(summary.maxConsecutiveLosses)} />
                    </div>
                );
            case 'graficos':
                return (
                    <div className="animate-fade-in space-y-6">
                        <SectionCard title="Curva de Capital">
                            <LineChart data={equityCurve} />
                        </SectionCard>
                        <SectionCard title="Rendimiento Mensual">
                            {monthlyPerformance.map(yearData => {
                                const monthOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                                const sortedMonths = [...yearData.months].sort((a, b) => monthOrder.indexOf(a.name) - monthOrder.indexOf(b.name));
                                return (
                                    <div key={yearData.year}>
                                        <h3 className="font-bold text-brand-text title-large mb-4">{yearData.year}</h3>
                                        <BarChart data={sortedMonths.map(month => ({ label: month.name, value: month.pnl }))} sortByValue={false} />
                                    </div>
                                );
                            })}
                        </SectionCard>
                    </div>
                );
            case 'desglose':
                return (
                    <div className="animate-fade-in space-y-6">
                        <SectionCard title="Rendimiento por Símbolo">
                            <BarChart data={performanceBySymbol || []} />
                        </SectionCard>
                        <SectionCard title="Rendimiento por Dirección">
                            <BarChart data={performanceByDirection || []} />
                        </SectionCard>
                        <SectionCard title="Rendimiento por Día de la Semana">
                            <BarChart data={performanceByDayData} sortByValue={false} />
                        </SectionCard>
                    </div>
                );
        }
    }


    return (
        <div className="p-4 sm:p-6 max-w-7xl mx-auto animate-fade-in pb-24">
            <div className="flex items-center mb-6">
                <ChartPieIcon className="w-8 h-8 sm:w-10 sm:h-10 text-brand-accent mr-4" />
                <h1 className="headline-medium font-bold text-brand-text">Análisis de Rendimiento</h1>
            </div>

            <div className="mb-6 border-b border-brand-border-secondary">
                <nav className="flex space-x-2 sm:space-x-4 -mb-px" aria-label="Tabs">
                    <TabButton name="Resumen" isActive={activeTab === 'resumen'} onClick={() => setActiveTab('resumen')} />
                    <TabButton name="Gráficos" isActive={activeTab === 'graficos'} onClick={() => setActiveTab('graficos')} />
                    <TabButton name="Desglose" isActive={activeTab === 'desglose'} onClick={() => setActiveTab('desglose')} />
                </nav>
            </div>

            <div>
                {renderContent()}
            </div>
        </div>
    );
};

// Sub-components for stats page
const TabButton: React.FC<{ name: string; isActive: boolean; onClick: () => void }> = ({ name, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`whitespace-nowrap py-3 px-2 sm:px-4 border-b-2 font-bold label-large transition-colors focus:outline-none rounded-t-md
      ${isActive
                ? 'border-brand-accent text-brand-accent'
                : 'border-transparent text-brand-text-secondary hover:text-brand-text hover:border-brand-border-secondary'
            }
    `}
        aria-current={isActive ? 'page' : undefined}
    >
        {name}
    </button>
);

const StatCard: React.FC<{
    label: string;
    value: string;
    sentiment?: 'positive' | 'warning' | 'negative';
    description?: string;
}> = ({ label, value, sentiment, description }) => {
    const sentimentColor =
        sentiment === 'positive' ? 'text-brand-success' :
            sentiment === 'warning' ? 'text-brand-warning-high' :
                sentiment === 'negative' ? 'text-brand-danger' :
                    'text-brand-text';

    return (
        <div className="bg-brand-light p-4 rounded-2xl border border-brand-border-secondary/50 shadow-sm">
            <div className="flex items-center justify-between mb-1">
                <p className="label-medium text-brand-text-secondary truncate pr-2">{label}</p>
                {description && (
                    <div className="group relative flex justify-center">
                        <InfoIcon className="w-4 h-4 text-brand-text-secondary cursor-help" />
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-brand-dark text-brand-text body-small p-2 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 text-center">
                            {description}
                        </span>
                    </div>
                )}
            </div>
            <p className={`headline-small font-bold font-mono ${sentimentColor}`}>{value}</p>
        </div>
    );
};

const SectionCard: React.FC<{ title: string; children: React.ReactNode, className?: string }> = ({ title, children, className }) => {
    return (
        <div className={`bg-brand-light rounded-3xl border border-brand-border-secondary/50 ${className} overflow-hidden shadow-sm`}>
            <div className="p-4 sm:p-5 border-b border-brand-border-secondary/50">
                <h2 className="title-large font-bold text-brand-text">{title}</h2>
            </div>
            <div className="p-4 sm:p-5">
                {children}
            </div>
        </div>
    );
};

const BarChart: React.FC<{ data: { label: string; value: number }[]; sortByValue?: boolean }> = ({ data, sortByValue = true }) => {
    if (data.length === 0) {
        return <p className="body-medium text-brand-text-secondary italic">No hay datos para mostrar.</p>
    }
    const maxValue = Math.max(...data.map(d => Math.abs(d.value)), 1);
    const displayData = sortByValue ? [...data].sort((a, b) => b.value - a.value) : data;

    return (
        <div className="space-y-4">
            {displayData.map(({ label, value }) => {
                const width = (Math.abs(value) / maxValue) * 100;
                const isPositive = value >= 0;
                return (
                    <div key={label} className="group">
                        <div className="flex justify-between items-center mb-1 label-medium">
                            <span className="font-medium text-brand-text-secondary truncate pr-2">{label}</span>
                            <span className={`font-mono font-semibold ${isPositive ? 'text-brand-success' : 'text-brand-danger'}`}>{value.toFixed(2)}</span>
                        </div>
                        <div className="w-full bg-brand-tertiary rounded-full h-2.5 overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${isPositive ? 'bg-brand-success' : 'bg-brand-danger'}`}
                                style={{ width: `${width}%` }}
                            />
                        </div>
                    </div>
                )
            })}
        </div>
    );
}

const LineChart: React.FC<{ data: { time: number, balance: number }[] }> = ({ data }) => {
    if (data.length < 2) {
        return <p className="body-medium text-brand-text-secondary italic">No hay suficientes datos para mostrar el gráfico.</p>;
    }

    const width = 500;
    const height = 250;
    const padding = { top: 20, right: 20, bottom: 40, left: 70 };

    const minX = data[0].time;
    const maxX = data[data.length - 1].time;
    const minYValue = Math.min(...data.map(d => d.balance));
    const maxYValue = Math.max(...data.map(d => d.balance));

    // Add buffer to min/max Y for better visual clarity
    const yRange = maxYValue - minYValue;
    const minY = yRange === 0 ? minYValue - 1 : minYValue - yRange * 0.1;
    const maxY = yRange === 0 ? maxYValue + 1 : maxYValue + yRange * 0.1;

    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const getX = (time: number) => {
        return ((time - minX) / (maxX - minX)) * chartWidth + padding.left;
    };
    const getY = (balance: number) => {
        if (maxY === minY) { // Handle case with no variation
            return height - padding.bottom - chartHeight / 2;
        }
        return height - (((balance - minY) / (maxY - minY)) * chartHeight + padding.bottom);
    };

    const linePath = data.map(d => `${getX(d.time).toFixed(2)},${getY(d.balance).toFixed(2)}`).join(' L ');
    const areaPath = `M ${getX(data[0].time).toFixed(2)},${height - padding.bottom} L ${linePath} L ${getX(data[data.length - 1].time).toFixed(2)},${height - padding.bottom} Z`;

    const yAxisLabels = [];
    const numGridLines = 5;
    for (let i = 0; i <= numGridLines; i++) {
        const value = minY + (i * (maxY - minY)) / numGridLines;
        const yPos = getY(value);
        yAxisLabels.push({
            value: value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            y: yPos
        });
    }

    return (
        <div className="relative w-full h-64 sm:h-72">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" aria-label={`Gráfico de curva de capital desde ${new Date(minX).toLocaleDateString()} hasta ${new Date(maxX).toLocaleDateString()}`}>
                <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgb(var(--accent))" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="rgb(var(--accent))" stopOpacity="0" />
                    </linearGradient>
                </defs>

                {/* Grid lines and Y-axis labels */}
                {yAxisLabels.map((label, i) => (
                    <g key={i} className="text-brand-text-secondary">
                        <line
                            x1={padding.left}
                            y1={label.y}
                            x2={width - padding.right}
                            y2={label.y}
                            stroke="rgb(var(--border-secondary))"
                            strokeWidth="0.5"
                            strokeDasharray="2,3"
                        />
                        <text x={padding.left - 8} y={label.y + 3} textAnchor="end" className="font-mono label-small fill-current">
                            {label.value}
                        </text>
                    </g>
                ))}

                {/* X-axis labels */}
                <g className="label-small fill-current text-brand-text-secondary">
                    <text x={padding.left} y={height - padding.bottom + 15} textAnchor="start">
                        {new Date(minX).toLocaleDateString()}
                    </text>
                    <text x={width - padding.right} y={height - padding.bottom + 15} textAnchor="end">
                        {new Date(maxX).toLocaleDateString()}
                    </text>
                </g>

                {/* Area and Line */}
                <path d={areaPath} fill="url(#areaGradient)" />
                <path d={`M ${linePath}`} stroke="rgb(var(--accent))" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        </div>
    );
};


export default PerformanceStats;