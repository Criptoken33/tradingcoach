import React, { useState, useRef } from 'react';
import { Cog6ToothIcon, ArrowDownTrayIcon, ArrowUpTrayIcon, InfoIcon, ChecklistIcon, SaveIcon, SunIcon, MoonIcon, ComputerDesktopIcon, ExclamationTriangleIcon, TrashIcon } from './icons';
import { Theme } from '../App';
import { MT5ReportData } from '../types';
import { FileService } from '../src/services/fileService';

interface SettingsValues {
    accountBalance: string;
    dailyLossLimit: string;
    weeklyLossLimit: string;
}

interface AppData {
    pairsState: any;
    tradingLog: any;
    settings: any;
    checklists: any;
    activeChecklistIds: any;
    dynamicRiskPercentage: number;
    mt5ReportData: any;
}

interface SettingsProps {
    currentSettings: SettingsValues;
    onSave: (newSettings: SettingsValues) => void;
    appData: AppData;
    onImportData: (data: any) => void;
    onImportMt5Report: (htmlContent: string) => void;
    onShowToast: (message: string) => void;
    onNavigateToChecklistEditor: () => void;
    theme: Theme;
    setTheme: (theme: Theme) => void;
    currentAccountBalance: number;
    mt5ReportData: MT5ReportData | null;
    onResetAppData: () => void;
    onDeleteMt5Report: () => void;
    onLogout: () => void;
    onShowPaywall: () => void;
    isPro: boolean;
}


const Settings: React.FC<SettingsProps> = ({ currentSettings, onSave, appData, onImportData, onImportMt5Report, onShowToast, onNavigateToChecklistEditor, theme, setTheme, currentAccountBalance, mt5ReportData, onResetAppData, onDeleteMt5Report, onLogout, onShowPaywall, isPro }) => {
    const [settings, setSettings] = useState<SettingsValues>(currentSettings);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const mt5FileInputRef = useRef<HTMLInputElement>(null);
    const isBalanceSynced = !!mt5ReportData;
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const [isDeleteReportModalOpen, setIsDeleteReportModalOpen] = useState(false);

    const handleSave = () => {
        const dailyLimit = parseFloat(settings.dailyLossLimit);
        const weeklyLimit = parseFloat(settings.weeklyLossLimit);

        if (isNaN(dailyLimit) || dailyLimit < 0) {
            onShowToast('Error: El límite de pérdida diaria debe ser un número positivo.');
            return;
        }
        if (isNaN(weeklyLimit) || weeklyLimit < 0) {
            onShowToast('Error: El límite de pérdida semanal debe ser un número positivo.');
            return;
        }

        let balanceToSave = settings.accountBalance;
        if (!isBalanceSynced) {
            const balance = parseFloat(settings.accountBalance);
            if (isNaN(balance) || balance < 0) {
                onShowToast('Error: El capital de la cuenta debe ser un número positivo.');
                return;
            }
        } else {
            balanceToSave = currentSettings.accountBalance;
        }

        onSave({
            accountBalance: balanceToSave,
            dailyLossLimit: settings.dailyLossLimit,
            weeklyLossLimit: settings.weeklyLossLimit,
        });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleExport = async () => {
        if (!isPro) {
            onShowPaywall();
            return;
        }
        try {
            const dataStr = JSON.stringify(appData, null, 2);
            const date = new Date().toISOString().split('T')[0];
            const fileName = `tradingcoach_backup_${date}.json`;

            await FileService.exportData(fileName, dataStr);

            // En Android/iOS esto aparecerá después de que se cierre el menú de compartir
            // En Web aparecerá después de la descarga
            onShowToast('Exportación finalizada.');
        } catch (error) {
            console.error('Error exporting data:', error);
            onShowToast('Error al exportar los datos.');
        }
    };

    const handleImportClick = () => {
        if (!isPro) {
            onShowPaywall();
            return;
        }
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') throw new Error('File is not valid text');
                const data = JSON.parse(text);

                if (data && data.pairsState && data.tradingLog && data.settings) {
                    onImportData(data);
                } else {
                    onShowToast('Error: El archivo de respaldo no tiene el formato correcto.');
                }
            } catch (error) {
                console.error('Error importing data:', error);
                onShowToast('Error al leer o procesar el archivo.');
            }
        };
        reader.onerror = () => {
            onShowToast('Error al leer el archivo.');
        };
        reader.readAsText(file);

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleImportMt5ReportClick = () => {
        mt5FileInputRef.current?.click();
    };

    const handleMt5FileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const htmlContent = e.target?.result;
                if (typeof htmlContent !== 'string') throw new Error('File is not valid text');
                onImportMt5Report(htmlContent);
            } catch (error) {
                console.error('Error reading MT5 report:', error);
                onShowToast('Error al leer el archivo de reporte.');
            }
        };
        reader.readAsText(file);

        if (mt5FileInputRef.current) {
            mt5FileInputRef.current.value = '';
        }
    };

    return (
        <div className="p-4 sm:p-6 max-w-3xl mx-auto animate-fade-in pb-24">
            <div className="flex items-center mb-6">
                <Cog6ToothIcon className="w-8 h-8 sm:w-10 sm:h-10 text-brand-accent mr-4" />
                <h1 className="text-2xl sm:text-4xl font-bold text-brand-text">Ajustes</h1>
            </div>

            <div className="space-y-6">
                <SectionCard
                    title="Apariencia"
                    description="Elige cómo quieres que se vea la aplicación."
                >
                    <ThemeSwitcher theme={theme} setTheme={setTheme} />
                </SectionCard>

                <SectionCard
                    title="Parámetros de Riesgo"
                    description="Estos valores se usan para el cálculo de riesgo y los límites de pérdida automáticos."
                    headerAction={<button onClick={handleSave} aria-label="Guardar Ajustes" className="bg-brand-accent hover:brightness-110 text-white p-3 rounded-2xl shadow-md transition-all"><SaveIcon className="w-6 h-6" /></button>}
                >
                    <div className="space-y-4">
                        <div>
                            <Input
                                label={isBalanceSynced ? "Capital Actual (Sincronizado)" : "Capital Inicial ($)"}
                                name="accountBalance"
                                type="text"
                                value={isBalanceSynced ? currentAccountBalance.toFixed(2) : settings.accountBalance}
                                onChange={handleChange}
                                readOnly={isBalanceSynced}
                                className={isBalanceSynced ? '!bg-brand-tertiary/60 cursor-not-allowed' : ''}
                            />
                            {isBalanceSynced && (
                                <p className="text-xs text-brand-text-secondary mt-1">
                                    Sincronizado desde el reporte de MT5 y el diario.
                                </p>
                            )}
                        </div>
                        <Input
                            label="Límite Pérdida Diaria (%)"
                            name="dailyLossLimit"
                            type="number"
                            min="0"
                            value={settings.dailyLossLimit}
                            onChange={handleChange}
                            placeholder="1"
                            step="0.1"
                        />
                        <Input
                            label="Límite Pérdida Semanal (%)"
                            name="weeklyLossLimit"
                            type="number"
                            min="0"
                            value={settings.weeklyLossLimit}
                            onChange={handleChange}
                            placeholder="2.5"
                            step="0.1"
                        />
                    </div>
                </SectionCard>

                <SectionCard
                    title="Gestor de Checklists"
                    description="Crea, edita y gestiona tus checklists de estrategias para adaptarlos a tu operativa."
                >
                    <button onClick={onNavigateToChecklistEditor} className="w-full flex items-center justify-center gap-3 bg-brand-accent-container hover:bg-brand-accent/20 text-brand-accent font-bold py-4 px-4 rounded-2xl transition-colors">
                        <ChecklistIcon className="w-6 h-6" />
                        <span>Abrir Gestor de Checklists</span>
                    </button>
                </SectionCard>


                <SectionCard
                    title="Gestión de Datos"
                    description="Importa tu reporte de MT5 o gestiona las copias de seguridad de la aplicación."
                >
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-base font-bold text-brand-text mb-2 flex items-center gap-2">
                                Sincronización de Historial
                                {!isPro && <span className="bg-brand-accent/10 text-brand-accent text-[10px] px-1.5 py-0.5 rounded-full border border-brand-accent/20">PRO</span>}
                            </h3>
                            <button onClick={isPro ? handleImportMt5ReportClick : onShowPaywall} className="w-full flex items-center justify-center gap-3 bg-brand-accent hover:brightness-110 text-white font-bold py-4 px-4 rounded-2xl transition-colors shadow-lg relative overflow-hidden group">
                                <ArrowUpTrayIcon className="w-6 h-6" />
                                <span>Importar Reporte de MT5</span>
                                {!isPro && (
                                    <div className="absolute inset-0 bg-black/5 flex items-center justify-end pr-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Cog6ToothIcon className="w-5 h-5 animate-spin-slow opacity-20" />
                                    </div>
                                )}
                            </button>
                            <input type="file" ref={mt5FileInputRef} onChange={handleMt5FileChange} accept=".html,.htm" className="hidden" />
                        </div>

                        <div className="pt-6 border-t border-brand-border-secondary">
                            <h3 className="text-base font-bold text-brand-text mb-4 flex items-center gap-2">
                                Copias de Seguridad
                                {isPro && <span className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-[10px] px-1.5 py-0.5 rounded-full border border-green-200 dark:border-green-800">SINCRONIZADO</span>}
                            </h3>
                            <div className="space-y-3">
                                {!isPro && (
                                    <p className="text-xs text-brand-text-secondary mb-4 bg-brand-tertiary p-3 rounded-xl italic">
                                        Las copias de seguridad automáticas en la nube son una función <strong>PRO</strong>. Tus datos actuales se guardan localmente.
                                    </p>
                                )}
                                <ActionButton onClick={handleExport} icon={<ArrowDownTrayIcon className="w-6 h-6" />}>
                                    Exportar Datos (JSON)
                                </ActionButton>
                                <ActionButton onClick={handleImportClick} icon={<ArrowUpTrayIcon className="w-6 h-6" />}>
                                    Importar Datos
                                </ActionButton>
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
                            </div>
                        </div>
                    </div>
                </SectionCard>

                <SectionCard
                    title="Zona de Peligro"
                    description="Acciones permanentes que no se pueden deshacer. Ten cuidado."
                >
                    <ActionButton
                        onClick={() => setIsResetModalOpen(true)}
                        icon={<ExclamationTriangleIcon className="w-5 h-5" />}
                        isDanger={true}
                    >
                        Reiniciar Diario y Registro
                    </ActionButton>
                    <p className="text-xs text-brand-text-secondary mt-2">
                        Esto borrará tu diario de operaciones y la lista de seguimiento. Los ajustes y checklists no se verán afectados.
                    </p>
                    {mt5ReportData && (
                        <div className="mt-4 pt-4 border-t border-brand-border-secondary/50">
                            <ActionButton
                                onClick={() => setIsDeleteReportModalOpen(true)}
                                icon={<TrashIcon className="w-5 h-5" />}
                                isDanger={true}
                            >
                                Eliminar Reporte de MT5
                            </ActionButton>
                            <p className="text-xs text-brand-text-secondary mt-2">
                                Desvinculará el reporte importado. El capital volverá a ser gestionado manualmente.
                            </p>
                        </div>
                    )}
                </SectionCard>

                <SectionCard
                    title="Cuenta"
                    description="Gestiona tu sesión y perfil de usuario."
                >
                    <div className="flex flex-col sm:flex-row gap-4">
                        <ActionButton
                            onClick={onLogout}
                            icon={<ArrowUpTrayIcon className="w-6 h-6 rotate-90" />}
                        >
                            Cerrar Sesión
                        </ActionButton>
                    </div>
                </SectionCard>
            </div>

            {isResetModalOpen && (
                <ResetConfirmationModal
                    onConfirm={() => {
                        onResetAppData();
                        setIsResetModalOpen(false);
                    }}
                    onCancel={() => setIsResetModalOpen(false)}
                />
            )}
            {isDeleteReportModalOpen && (
                <DeleteReportConfirmationModal
                    onConfirm={() => {
                        onDeleteMt5Report();
                        setIsDeleteReportModalOpen(false);
                    }}
                    onCancel={() => setIsDeleteReportModalOpen(false)}
                />
            )}
        </div>
    );
};

const SectionCard: React.FC<{ title: string; description: string; children: React.ReactNode; headerAction?: React.ReactNode }> = ({ title, description, children, headerAction }) => (
    <div className="bg-brand-light p-5 sm:p-6 rounded-3xl border border-brand-border-secondary/50 shadow-sm">
        <div className="flex justify-between items-start mb-4">
            <div>
                <h2 className="text-xl font-bold text-brand-text">{title}</h2>
                <p className="text-sm text-brand-text-secondary mt-1">{description}</p>
            </div>
            {headerAction && <div className="ml-4 flex-shrink-0">{headerAction}</div>}
        </div>
        <div>{children}</div>
    </div>
);


const ActionButton: React.FC<{ onClick: () => void; icon: React.ReactNode; children: React.ReactNode; isDanger?: boolean }> = ({ onClick, icon, children, isDanger }) => (
    <button
        onClick={onClick}
        className={`w-full flex-1 flex items-center justify-center gap-3 font-bold py-4 px-4 rounded-2xl transition-colors
            ${isDanger
                ? 'bg-brand-danger/10 hover:bg-brand-danger/20 text-brand-danger'
                : 'bg-brand-tertiary hover:bg-brand-border-secondary/50 text-brand-text'
            }
        `}
    >
        {icon}
        <span>{children}</span>
    </button>
);

const ResetConfirmationModal: React.FC<{ onConfirm: () => void; onCancel: () => void; }> = ({ onConfirm, onCancel }) => {
    return (
        <div className="fixed inset-0 bg-brand-dark/80 z-[100] animate-fade-in flex items-center justify-center backdrop-blur-sm p-4" onClick={onCancel}>
            <div className="bg-brand-light w-full max-w-sm rounded-4xl p-6 shadow-2xl text-center" onClick={e => e.stopPropagation()}>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-danger/10 mb-4">
                    <ExclamationTriangleIcon className="h-7 w-7 text-brand-danger" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-bold text-brand-text">¿Estás seguro?</h3>
                <p className="mt-2 text-sm text-brand-text-secondary">
                    Esta acción eliminará permanentemente tu diario de operaciones y tu lista de seguimiento. No podrás recuperar estos datos.
                </p>
                <div className="mt-6 flex flex-col sm:flex-row-reverse gap-3">
                    <button
                        type="button"
                        className="w-full justify-center rounded-2xl bg-brand-danger px-4 py-3 text-sm font-semibold text-white shadow-sm hover:brightness-110 transition-all"
                        onClick={onConfirm}
                    >
                        Sí, reiniciar datos
                    </button>
                    <button
                        type="button"
                        className="w-full justify-center rounded-2xl bg-brand-tertiary px-4 py-3 text-sm font-semibold text-brand-text shadow-sm hover:bg-brand-border-secondary/50 transition-colors"
                        onClick={onCancel}
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
};

const DeleteReportConfirmationModal: React.FC<{ onConfirm: () => void; onCancel: () => void; }> = ({ onConfirm, onCancel }) => {
    return (
        <div className="fixed inset-0 bg-brand-dark/80 z-[100] animate-fade-in flex items-center justify-center backdrop-blur-sm p-4" onClick={onCancel}>
            <div className="bg-brand-light w-full max-w-sm rounded-4xl p-6 shadow-2xl text-center" onClick={e => e.stopPropagation()}>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-danger/10 mb-4">
                    <ExclamationTriangleIcon className="h-7 w-7 text-brand-danger" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-bold text-brand-text">¿Eliminar Reporte de MT5?</h3>
                <p className="mt-2 text-sm text-brand-text-secondary">
                    Esta acción es irreversible. Se eliminará el reporte y el capital de la cuenta se desvinculará.
                </p>
                <div className="mt-6 flex flex-col sm:flex-row-reverse gap-3">
                    <button
                        type="button"
                        className="w-full justify-center rounded-2xl bg-brand-danger px-4 py-3 text-sm font-semibold text-white shadow-sm hover:brightness-110 transition-all"
                        onClick={onConfirm}
                    >
                        Sí, eliminar
                    </button>
                    <button
                        type="button"
                        className="w-full justify-center rounded-2xl bg-brand-tertiary px-4 py-3 text-sm font-semibold text-brand-text shadow-sm hover:bg-brand-border-secondary/50 transition-colors"
                        onClick={onCancel}
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
};


const ThemeSwitcher: React.FC<{ theme: Theme, setTheme: (theme: Theme) => void }> = ({ theme, setTheme }) => {
    const options: { value: Theme; label: string; icon: React.ReactNode }[] = [
        { value: 'light', label: 'Claro', icon: <SunIcon className="w-5 h-5" /> },
        { value: 'dark', label: 'Oscuro', icon: <MoonIcon className="w-5 h-5" /> },
        { value: 'system', label: 'Sistema', icon: <ComputerDesktopIcon className="w-5 h-5" /> },
    ];

    return (
        <div className="flex bg-brand-tertiary/60 p-1 rounded-full border border-brand-border-secondary/50">
            {options.map(option => (
                <button
                    key={option.value}
                    onClick={() => setTheme(option.value)}
                    className={`
                        flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-full text-sm font-bold transition-all
                        ${theme === option.value
                            ? 'bg-brand-light text-brand-accent shadow'
                            : 'text-brand-text-secondary hover:bg-brand-light/50'
                        }
                    `}
                    aria-pressed={theme === option.value}
                >
                    {option.icon}
                    <span>{option.label}</span>
                </button>
            ))}
        </div>
    );
};

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, ...props }) => (
    <div className="relative group">
        <label className="block text-xs font-bold text-brand-text-secondary mb-1 uppercase tracking-wider">{label}</label>
        <input {...props} className={`w-full bg-brand-tertiary border-b-2 border-brand-text-secondary/50 rounded-t-lg px-4 py-3 text-brand-text text-lg focus:border-brand-accent outline-none transition-colors placeholder:text-brand-text-secondary/30 ${props.readOnly ? 'cursor-default' : ''} ${props.className}`} />
    </div>
);


export default Settings;