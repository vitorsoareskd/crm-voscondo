import {
  CONDOMINIOS_INICIAIS,
  SERVICOS_EXTRAS_INICIAIS,
  INADIMPLENTES_INICIAIS,
  TAREFAS_GANTT_INICIAIS,
  TAREFAS_EQUIPE_INICIAIS,
  FORNECEDORES_INICIAIS,
  PORQUINHOS_INICIAIS,
  TRANSACOES_EXTRATO_INICIAIS,
  PROJECAO_ITEMS_INICIAIS,
  RELATORIOS_ORCAMENTO_INICIAIS
} from '../data/initialData';

// Generic loader with fallback to initial data
export function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const isCleared = localStorage.getItem('vos_data_cleared') === 'true';
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(fallback)) {
        if (Array.isArray(parsed)) {
          const validItems = parsed.filter((item) => item && typeof item === 'object');
          // If local storage has an empty array (from previous clear) and user has not explicitly cleared data, restore real fallback data
          if (validItems.length === 0 && fallback.length > 0 && !isCleared) {
            return fallback;
          }
          return validItems as unknown as T;
        }
        return fallback;
      }
      return (parsed ?? fallback) as T;
    }
    if (isCleared && Array.isArray(fallback)) {
      return [] as unknown as T;
    }
  } catch (error) {
    console.warn(`Error loading ${key} from localStorage:`, error);
  }
  return fallback;
}

// Generic saver
export function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.warn(`Error saving ${key} to localStorage:`, error);
  }
}

// Storage Keys
export const STORAGE_KEYS = {
  CONDOMINIOS: 'vos_condominios',
  SERVICOS_EXTRAS: 'vos_servicos_extras',
  INADIMPLENTES: 'vos_inadimplentes',
  TAREFAS_GANTT: 'vos_tarefas_gantt',
  TAREFAS_EQUIPE: 'vos_tarefas_equipe',
  FORNECEDORES: 'vos_fornecedores',
  PORQUINHOS: 'vos_porquinhos',
  TRANSACOES_EXTRATO: 'vos_transacoes_extrato',
  PROJECAO_ITEMS: 'vos_projecao_items',
  RELATORIOS_ORCAMENTO: 'vos_relatorios_orcamento',
};

// Function to clear all application data (blank state)
export function clearAllAppData(): void {
  localStorage.setItem('vos_data_cleared', 'true');
  Object.values(STORAGE_KEYS).forEach((key) => {
    localStorage.setItem(key, JSON.stringify([]));
  });
}

// Function to reset all data back to real database defaults
export function resetAllToInitialData(): void {
  localStorage.removeItem('vos_data_cleared');
  saveToStorage(STORAGE_KEYS.CONDOMINIOS, CONDOMINIOS_INICIAIS);
  saveToStorage(STORAGE_KEYS.SERVICOS_EXTRAS, SERVICOS_EXTRAS_INICIAIS);
  saveToStorage(STORAGE_KEYS.INADIMPLENTES, INADIMPLENTES_INICIAIS);
  saveToStorage(STORAGE_KEYS.TAREFAS_GANTT, TAREFAS_GANTT_INICIAIS);
  saveToStorage(STORAGE_KEYS.TAREFAS_EQUIPE, TAREFAS_EQUIPE_INICIAIS);
  saveToStorage(STORAGE_KEYS.FORNECEDORES, FORNECEDORES_INICIAIS);
  saveToStorage(STORAGE_KEYS.PORQUINHOS, PORQUINHOS_INICIAIS);
  saveToStorage(STORAGE_KEYS.TRANSACOES_EXTRATO, TRANSACOES_EXTRATO_INICIAIS);
  saveToStorage(STORAGE_KEYS.PROJECAO_ITEMS, PROJECAO_ITEMS_INICIAIS);
  saveToStorage(STORAGE_KEYS.RELATORIOS_ORCAMENTO, RELATORIOS_ORCAMENTO_INICIAIS);
}
