import React, { useState, useEffect, useRef } from 'react';
import { Checklist, ChecklistItem, Phase, ChecklistItemType } from '../types';
import { PencilIcon, TrashIcon, PlusIcon, DocumentDuplicateIcon, StarIcon, ArrowLeftIcon, SaveIcon, ArrowDownTrayIcon, ArrowUpTrayIcon, InfoIcon, XCircleIcon } from './icons';
import { FileService } from '../src/services/fileService';

interface ChecklistEditorProps {
    checklists: Checklist[];
    setChecklists: React.Dispatch<React.SetStateAction<Checklist[]>>;
    activeIds: { long: string, short: string };
    setActiveIds: React.Dispatch<React.SetStateAction<{ long: string, short: string }>>;
    onBack: () => void;
    onShowPaywall: () => void;
    isPro: boolean;
}

const MAX_FREE_CHECKLISTS = 3;

const generateId = () => `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const itemTypeDescriptions: { [key in ChecklistItemType]: { label: string; description: string } } = {
    [ChecklistItemType.BOOLEAN]: {
        label: 'Sí / No',
        description: 'Muestra botones de "Sí" y "No" para una verificación rápida.',
    },
    [ChecklistItemType.OPTIONS]: {
        label: 'Selección de Lista',
        description: 'Permite al usuario elegir una opción de una lista predefinida.',
    },
    [ChecklistItemType.VALUE]: {
        label: 'Entrada de Texto',
        description: 'Muestra un campo para que el usuario ingrese un valor o una nota.',
    }
};

const ChecklistEditor: React.FC<ChecklistEditorProps> = ({ checklists, setChecklists, activeIds, setActiveIds, onBack, onShowToast, onShowPaywall, isPro }) => {
    const [editingChecklist, setEditingChecklist] = useState<Checklist | null>(null);
    const [formState, setFormState] = useState<Checklist | null>(null);
    const [activePhaseTab, setActivePhaseTab] = useState(0);
    const [editingItem, setEditingItem] = useState<{ phaseIndex: number; itemIndex: number } | null>(null);
    const importFileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setFormState(editingChecklist ? JSON.parse(JSON.stringify(editingChecklist)) : null);
        setActivePhaseTab(0);
        setEditingItem(null);
    }, [editingChecklist]);

    const handleCreateNew = () => {
        if (!isPro) {
            onShowPaywall();
            return;
        }
        const newChecklist: Checklist = {
            id: generateId(),
            name: 'Nueva Estrategia',
            description: '',
            version: '1.0',
            tags: [],
            phases: [
                { phase: Phase.HINT, items: [] },
                { phase: Phase.TEST, items: [] },
                { phase: Phase.CONFIRMATION, items: [] },
            ],
        };
        setEditingChecklist(newChecklist);
    };

    const handleDuplicate = (checklistToDupe: Checklist) => {
        if (!isPro) {
            onShowPaywall();
            return;
        }
        const newChecklist: Checklist = {
            ...JSON.parse(JSON.stringify(checklistToDupe)),
            id: generateId(),
            name: `${checklistToDupe.name} (Copia)`,
        };
        setChecklists(prev => [...prev, newChecklist]);
        onShowToast(`'${checklistToDupe.name}' duplicado.`);
    };

    const handleDelete = (id: string) => {
        if (checklists.length <= 1) {
            onShowToast('No se puede eliminar el último checklist.');
            return;
        }
        if (id === activeIds.long || id === activeIds.short) {
            onShowToast('No se puede eliminar un checklist activo.');
            return;
        }
        setChecklists(prev => prev.filter(c => c.id !== id));
        onShowToast('Checklist eliminado.');
    };

    const handleSave = () => {
        if (!formState) return;
        if (!formState.name.trim()) {
            onShowToast('El nombre del checklist no puede estar vacío.');
            return;
        }

        const isNew = !checklists.some(c => c.id === formState.id);
        if (isNew) {
            setChecklists(prev => [...prev, formState]);
        } else {
            setChecklists(prev => prev.map(c => c.id === formState.id ? formState : c));
        }
        onShowToast(`'${formState.name}' guardado.`);
        setEditingChecklist(null);
    };

    const handleAddItem = (phaseIndex: number) => {
        if (!formState) return;
        const newItem: ChecklistItem = {
            id: generateId(),
            text: '',
            type: ChecklistItemType.BOOLEAN,
            timeframe: '5m',
            tooltip: '',
            options: [],
        };
        const newPhases = [...formState.phases];
        newPhases[phaseIndex].items.push(newItem);
        setFormState(prev => prev ? { ...prev, phases: newPhases } : null);
        setEditingItem({ phaseIndex, itemIndex: newPhases[phaseIndex].items.length - 1 });
    };

    const handleRemoveItem = (phaseIndex: number, itemId: string) => {
        if (!formState) return;
        const newPhases = [...formState.phases];
        newPhases[phaseIndex].items = newPhases[phaseIndex].items.filter(item => item.id !== itemId);
        setFormState(prev => prev ? { ...prev, phases: newPhases } : null);
    };

    const handleItemChange = (phaseIndex: number, itemIndex: number, field: keyof ChecklistItem, value: any) => {
        if (!formState) return;
        const newPhases = [...formState.phases];
        const phase = newPhases[phaseIndex];
        if (!phase.items[itemIndex]) return;

        const updatedItem = { ...phase.items[itemIndex], [field]: value };
        if (field === 'type' && value !== ChecklistItemType.OPTIONS) {
            delete updatedItem.options;
        }

        phase.items[itemIndex] = updatedItem;
        setFormState(prev => prev ? { ...prev, phases: newPhases } : null);
    };

    const handleExportChecklist = async (checklist: Checklist) => {
        if (!isPro) {
            onShowPaywall();
            return;
        }
        try {
            const dataStr = JSON.stringify(checklist, null, 2);
            const sanitizedName = checklist.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            const fileName = `tradingcoach_checklist_${sanitizedName}.json`;

            await FileService.exportData(fileName, dataStr);

            onShowToast('Exportación finalizada.');
        } catch (error) {
            onShowToast('Error al exportar el checklist.');
        }
    };

    const handleImportClick = () => {
        if (!isPro) {
            onShowPaywall();
            return;
        }
        importFileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedChecklist = JSON.parse(e.target?.result as string) as Checklist;
                if (!isPro && checklists.length >= MAX_FREE_CHECKLISTS) {
                    onShowPaywall();
                    return;
                }
                if (importedChecklist?.name && Array.isArray(importedChecklist.phases)) {
                    setChecklists(prev => [...prev, { ...importedChecklist, id: generateId(), name: `${importedChecklist.name} (Importado)` }]);
                    onShowToast('Checklist importado con éxito.');
                } else {
                    onShowToast('Error: El archivo no es un checklist válido.');
                }
            } catch (error) {
                onShowToast('Error al procesar el archivo del checklist.');
            }
        };
        reader.readAsText(file);
        if (importFileInputRef.current) importFileInputRef.current.value = '';
    };

    const handleCloseItemEditor = () => {
        if (formState && editingItem) {
            const { phaseIndex, itemIndex } = editingItem;
            const currentItem = formState.phases[phaseIndex]?.items[itemIndex];
            if (currentItem && !currentItem.text.trim()) {
                handleRemoveItem(phaseIndex, currentItem.id);
            }
        }
        setEditingItem(null);
    };

    if (formState) {
        const currentItem = editingItem ? formState.phases[editingItem.phaseIndex].items[editingItem.itemIndex] : null;
        return (
            <div className="p-4 sm:p-6 max-w-4xl mx-auto animate-fade-in pb-24">
                <div className="flex justify-between items-center mb-6">
                    <button onClick={() => setEditingChecklist(null)} aria-label="Volver" className="bg-tc-bg border border-tc-border-light text-tc-text p-2 rounded-full hover:bg-tc-bg-secondary transition-colors"><ArrowLeftIcon className="w-6 h-6" /></button>
                    <h1 className="text-xl sm:text-2xl font-bold text-tc-text text-center">Editor de Checklist</h1>
                    <button onClick={handleSave} aria-label="Guardar" className="bg-tc-growth-green hover:bg-tc-growth-green/90 text-white p-3 rounded-2xl shadow-md transition-all"><SaveIcon className="w-6 h-6" /></button>
                </div>

                <div className="space-y-6">
                    <SectionCard title="Metadatos">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input label="Nombre del Checklist" value={formState.name} onChange={e => setFormState(p => p ? { ...p, name: e.target.value } : null)} />
                            <Input label="Versión" value={formState.version} onChange={e => setFormState(p => p ? { ...p, version: e.target.value } : null)} />
                            <div className="md:col-span-2">
                                <Input label="Descripción" value={formState.description} onChange={e => setFormState(p => p ? { ...p, description: e.target.value } : null)} />
                            </div>
                            <div className="md:col-span-2">
                                <Input label="Etiquetas (separadas por coma)" value={formState.tags.join(', ')} onChange={e => setFormState(p => p ? { ...p, tags: e.target.value.split(',').map(t => t.trim()) } : null)} />
                            </div>
                        </div>
                    </SectionCard>

                    <SectionCard title="Puntos de Control">
                        <div className="border-b border-tc-border-light">
                            <nav className="flex space-x-2 sm:space-x-4 -mb-px">
                                {formState.phases.map((phase, index) => (
                                    <TabButton key={phase.phase} name={phase.phase.split('. ')[1]} isActive={activePhaseTab === index} onClick={() => setActivePhaseTab(index)} />
                                ))}
                            </nav>
                        </div>
                        <div className="pt-4 animate-fade-in">
                            {formState.phases[activePhaseTab].items.length > 0 ? (
                                <div className="space-y-2">
                                    {formState.phases[activePhaseTab].items.map((item, itemIndex) => (
                                        <div key={item.id} className="flex justify-between items-center p-3 rounded-2xl hover:bg-tc-bg-secondary transition-colors">
                                            <span className="text-sm text-tc-text truncate pr-2 flex items-center">
                                                <span className="font-mono text-tc-text-secondary mr-3 bg-tc-bg-secondary px-2 py-1 rounded-md text-xs">{item.timeframe}</span>
                                                {item.text || <span className="italic text-tc-text-secondary/75">Nueva condición...</span>}
                                            </span>
                                            <div className="flex-shrink-0">
                                                <button onClick={() => setEditingItem({ phaseIndex: activePhaseTab, itemIndex })} className="p-2 rounded-full text-tc-text-secondary hover:text-tc-growth-green"><PencilIcon className="w-5 h-5" /></button>
                                                <button onClick={() => handleRemoveItem(activePhaseTab, item.id)} className="p-2 rounded-full text-tc-text-secondary hover:text-tc-error"><TrashIcon className="w-5 h-5" /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-tc-text-secondary italic text-center py-4">No hay puntos de control en esta fase.</p>
                            )}
                            <button onClick={() => handleAddItem(activePhaseTab)} className="w-full mt-4 flex items-center justify-center gap-2 bg-tc-bg-secondary hover:bg-tc-bg-tertiary text-tc-text font-bold py-3 px-4 rounded-2xl transition-colors border border-tc-border-light">
                                <PlusIcon className="w-5 h-5" /> Añadir Punto de Control
                            </button>
                        </div>
                    </SectionCard>
                </div>

                {currentItem && editingItem && (
                    <ItemEditorModal
                        item={currentItem}
                        itemIndex={editingItem.itemIndex}
                        phaseIndex={editingItem.phaseIndex}
                        onClose={handleCloseItemEditor}
                        onChange={handleItemChange}
                        onShowToast={onShowToast}
                    />
                )}
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 max-w-4xl mx-auto animate-fade-in pb-32">
            <div className="flex items-center gap-4 mb-8">
                <button onClick={onBack} aria-label="Volver a Ajustes" className="bg-tc-bg border border-tc-border-light text-tc-text p-2 rounded-full hover:bg-tc-bg-secondary transition-colors">
                    <ArrowLeftIcon className="w-6 h-6" />
                </button>
                <h1 className="text-2xl sm:text-3xl font-bold text-tc-text">Gestor de Checklists</h1>
            </div>

            <div className="mb-6">
                <ActionButton onClick={handleImportClick} icon={<ArrowUpTrayIcon className="w-6 h-6" />}>
                    Importar Checklist
                </ActionButton>
                <input type="file" ref={importFileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
            </div>

            <div className="space-y-3">
                {checklists.map(c => (
                    <ChecklistCard
                        key={c.id}
                        checklist={c}
                        isActiveLong={activeIds.long === c.id}
                        isActiveShort={activeIds.short === c.id}
                        onSetActiveLong={() => {
                            if (!isPro && c.id !== 'default-long' && c.id !== 'default-short') {
                                onShowPaywall();
                                return;
                            }
                            setActiveIds(prev => ({ ...prev, long: c.id }));
                        }}
                        onSetActiveShort={() => {
                            if (!isPro && c.id !== 'default-long' && c.id !== 'default-short') {
                                onShowPaywall();
                                return;
                            }
                            setActiveIds(prev => ({ ...prev, short: c.id }));
                        }}
                        onEdit={() => {
                            if (!isPro && c.id !== 'default-long' && c.id !== 'default-short') {
                                onShowPaywall();
                                return;
                            }
                            setEditingChecklist(c);
                        }}
                        onDuplicate={() => handleDuplicate(c)}
                        onDelete={() => handleDelete(c.id)}
                        onExport={() => handleExportChecklist(c)}
                    />
                ))}
            </div>

            <button onClick={handleCreateNew} className="fixed bottom-24 right-6 w-14 h-14 bg-tc-growth-green hover:bg-tc-growth-green/90 text-white shadow-lg hover:shadow-xl flex items-center justify-center transition-all active:scale-95 z-40 rounded-2xl">
                <PlusIcon className="w-6 h-6" />
            </button>
        </div>
    );
};

const SectionCard: React.FC<{ title: string; children: React.ReactNode; }> = ({ title, children }) => (
    <div className="bg-tc-bg p-5 sm:p-6 rounded-3xl border border-tc-border-light shadow-sm">
        <h2 className="text-xl font-bold text-tc-text mb-4">{title}</h2>
        <div>{children}</div>
    </div>
);

const TabButton: React.FC<{ name: string; isActive: boolean; onClick: () => void }> = ({ name, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`whitespace-nowrap py-3 px-2 sm:px-4 border-b-2 font-bold text-sm sm:text-base transition-colors focus:outline-none rounded-t-md
      ${isActive
                ? 'border-tc-growth-green text-tc-growth-green'
                : 'border-transparent text-tc-text-secondary hover:text-tc-text hover:border-tc-border-medium'
            }
    `}
        aria-current={isActive ? 'page' : undefined}
    >
        {name}
    </button>
);


const ActionButton: React.FC<{ onClick: () => void; icon: React.ReactNode; children: React.ReactNode }> = ({ onClick, icon, children }) => (
    <button onClick={onClick} className="w-full flex items-center justify-center gap-3 bg-tc-bg-secondary hover:bg-tc-bg-tertiary text-tc-text font-bold py-4 px-4 rounded-2xl transition-colors border border-tc-border-light">
        {icon}
        <span>{children}</span>
    </button>
);

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, ...props }) => (
    <div className="relative group">
        <label className="block text-xs font-bold text-tc-text-secondary mb-1 uppercase tracking-wider">{label}</label>
        <input {...props} className={`w-full bg-tc-bg-secondary border-b-2 border-tc-border-medium rounded-t-lg px-4 py-3 text-tc-text text-lg focus:border-tc-growth-green outline-none transition-colors placeholder:text-tc-text-secondary/30 ${props.className}`} />
    </div>
);

const ChecklistCard: React.FC<{
    checklist: Checklist;
    isActiveLong: boolean;
    isActiveShort: boolean;
    onSetActiveLong: () => void;
    onSetActiveShort: () => void;
    onEdit: () => void;
    onDuplicate: () => void;
    onDelete: () => void;
    onExport: () => void;
}> = ({ checklist, isActiveLong, isActiveShort, onSetActiveLong, onSetActiveShort, onEdit, onDuplicate, onDelete, onExport }) => {
    return (
        <div className="bg-tc-bg border border-tc-border-light rounded-3xl p-4 shadow-sm">
            <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                    <p className="font-bold text-lg text-tc-text truncate">{checklist.name}</p>
                    <p className="text-sm text-tc-text-secondary">{checklist.phases.flatMap(p => p.items).length} puntos de control</p>
                </div>
                <div className="flex items-center space-x-1 ml-2 flex-shrink-0">
                    <button onClick={onEdit} className="p-2 rounded-full text-tc-text-secondary hover:bg-tc-bg-secondary" title="Editar"><PencilIcon className="w-5 h-5" /></button>
                    <button onClick={onDuplicate} className="p-2 rounded-full text-tc-text-secondary hover:bg-tc-bg-secondary" title="Duplicar"><DocumentDuplicateIcon className="w-5 h-5" /></button>
                </div>
            </div>
            <div className="mt-4 pt-4 border-t border-tc-border-light flex flex-col sm:flex-row gap-2">
                <div className="flex flex-1 gap-2">
                    <button onClick={onSetActiveLong} className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-sm font-bold transition-colors ${isActiveLong ? 'bg-tc-success text-white' : 'bg-tc-bg-secondary hover:bg-tc-bg-tertiary text-tc-text-secondary'}`}><StarIcon className="w-4 h-4" /> Long</button>
                    <button onClick={onSetActiveShort} className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-sm font-bold transition-colors ${isActiveShort ? 'bg-tc-error text-white' : 'bg-tc-bg-secondary hover:bg-tc-bg-tertiary text-tc-text-secondary'}`}><StarIcon className="w-4 h-4" /> Short</button>
                </div>
                <div className="flex flex-1 sm:flex-initial sm:w-auto gap-2">
                    <button onClick={onExport} className="flex-1 sm:flex-initial p-2 rounded-xl bg-tc-bg-secondary text-tc-text-secondary hover:bg-tc-bg-tertiary" title="Exportar"><ArrowDownTrayIcon className="w-5 h-5" /></button>
                    <button onClick={onDelete} className="flex-1 sm:flex-initial p-2 rounded-xl bg-tc-bg-secondary text-tc-text-secondary hover:bg-tc-error/20 hover:text-tc-error" title="Eliminar"><TrashIcon className="w-5 h-5" /></button>
                </div>
            </div>
        </div>
    );
};

const ItemEditorModal: React.FC<{
    item: ChecklistItem;
    phaseIndex: number;
    itemIndex: number;
    onClose: () => void;
    onChange: (phaseIndex: number, itemIndex: number, field: keyof ChecklistItem, value: any) => void;
    onShowToast: (message: string) => void;
}> = ({ item, phaseIndex, itemIndex, onClose, onChange, onShowToast }) => {
    const [optionInput, setOptionInput] = useState('');
    const [selectedType, setSelectedType] = useState(item.type);

    const handleOptionKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && optionInput.trim()) {
            e.preventDefault();
            const newOption = optionInput.trim();
            const currentOptions = item.options || [];
            if (!currentOptions.includes(newOption)) {
                onChange(phaseIndex, itemIndex, 'options', [...currentOptions, newOption]);
            }
            setOptionInput('');
        }
    };

    const handleRemoveOption = (optionToRemove: string) => {
        const newOptions = (item.options || []).filter(opt => opt !== optionToRemove);
        onChange(phaseIndex, itemIndex, 'options', newOptions.length > 0 ? newOptions : undefined);
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 animate-fade-in flex items-center justify-center backdrop-blur-sm p-4" onClick={onClose}>
            <div className="bg-tc-bg w-full sm:max-w-lg rounded-3xl overflow-hidden flex flex-col shadow-2xl border border-tc-border-light" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-tc-border-light flex justify-between items-center">
                    <h3 className="text-lg font-bold text-tc-text">Editar Punto de Control</h3>
                    <button onClick={onClose} className="p-2 text-tc-text-secondary hover:bg-tc-bg-secondary rounded-full"><XCircleIcon className="w-6 h-6" /></button>
                </div>
                <div className="p-4 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                    <Input label="Texto de la Pregunta" value={item.text} onChange={e => onChange(phaseIndex, itemIndex, 'text', e.target.value)} placeholder="¿Condición a verificar?" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input label="Timeframe" value={item.timeframe} onChange={e => onChange(phaseIndex, itemIndex, 'timeframe', e.target.value)} />
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <label className="block text-xs font-bold text-tc-text-secondary uppercase tracking-wider">Tipo</label>
                                <span className="relative group" tabIndex={0}>
                                    <InfoIcon className="w-4 h-4 text-tc-text-secondary cursor-help" />
                                    <span className="absolute bottom-full mb-2 w-56 text-center left-1/2 -translate-x-1/2 bg-tc-bg-secondary p-2 rounded-lg text-xs text-tc-text shadow-lg opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity pointer-events-none z-10">
                                        {itemTypeDescriptions[selectedType].description}
                                    </span>
                                </span>
                            </div>
                            <select
                                value={item.type}
                                onChange={e => {
                                    const newType = e.target.value as ChecklistItemType;
                                    onChange(phaseIndex, itemIndex, 'type', newType);
                                    setSelectedType(newType);
                                }}
                                className="w-full bg-tc-bg-secondary border-b-2 border-tc-border-medium rounded-t-lg px-4 py-3 text-tc-text text-lg focus:border-tc-growth-green outline-none transition-colors appearance-none"
                            >
                                {Object.keys(itemTypeDescriptions).map(key => (
                                    <option key={key} value={key}>{itemTypeDescriptions[key as ChecklistItemType].label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <Input label="Tooltip (Opcional)" value={item.tooltip || ''} onChange={e => onChange(phaseIndex, itemIndex, 'tooltip', e.target.value)} />

                    {item.type === ChecklistItemType.OPTIONS && (
                        <div>
                            <label className="block text-xs font-bold text-tc-text-secondary uppercase tracking-wider mb-2">Opciones</label>
                            <div className="flex items-center gap-2 bg-tc-bg-secondary rounded-t-lg border-b-2 border-tc-border-medium px-3 py-2 transition-colors focus-within:border-tc-growth-green">
                                <input type="text" value={optionInput} onChange={e => setOptionInput(e.target.value)} onKeyDown={handleOptionKeyDown} className="flex-grow bg-transparent text-tc-text focus:outline-none placeholder:text-tc-text-secondary/70 text-lg" placeholder="Añadir y presionar Enter..." />
                            </div>
                            <div className="flex flex-wrap gap-2 mt-3">
                                {(item.options || []).map(option => (
                                    <span key={option} className="flex items-center gap-1.5 bg-tc-growth-green/10 text-tc-growth-green text-sm font-semibold px-2.5 py-1.5 rounded-full border border-tc-growth-green/20">
                                        {option}
                                        <button type="button" onClick={() => handleRemoveOption(option)} className="bg-tc-growth-green/20 hover:bg-tc-growth-green/40 rounded-full w-4 h-4 flex items-center justify-center text-xs font-bold">&times;</button>
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChecklistEditor;
