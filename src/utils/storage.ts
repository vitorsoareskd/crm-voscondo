import {
  CONDOMINIOS_INICIAIS,
  SERVICOS_EXTRAS_INICIAIS,
  INADIMPLENTES_INICIAIS,
  TAREFAS_GANTT_INICIAIS,
  TAREFAS_EQUIPE_INICIAIS,
  FORNECEDORES_INICIAIS,
  PORQUINHOS_INICIAIS,
  TRANSACOES_EXTRATO_INICIAIS,
  PROJECAO_ITEMS_INICIAIS
} from '../data/initialData';

// Generic loader with fallback to initial data
export function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const isCleared = localStorage.getItem('vos_data_cleared') === 'true';
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored) as T;
    }
    if (isCleared) {
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
};

// Function to clear all application data (blank state)
export function clearAllAppData(): void {
  localStorage.setItem('vos_data_cleared', 'true');
  Object.values(STORAGE_KEYS).forEach((key) => {
    localStorage.setItem(key, JSON.stringify([]));
  });
}

// Function to reset all data back to demo defaults
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
}
