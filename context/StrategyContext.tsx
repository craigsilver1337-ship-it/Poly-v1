'use client';

import { createContext, useContext, useReducer, ReactNode, useCallback } from 'react';
import { Position, Market, MarketCluster, ScannerResult, ResearchDraft } from '@/types';
import { generateId } from '@/lib/utils';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface StrategyState {
  positions: Position[];
  clusterMarkets: Market[];
  scannerResult: ScannerResult | null;
  discountRate: number;
}

type StrategyAction =
  | { type: 'ADD_POSITION'; payload: Position }
  | { type: 'REMOVE_POSITION'; payload: string }
  | { type: 'UPDATE_POSITION'; payload: { id: string; updates: Partial<Position> } }
  | { type: 'CLEAR_POSITIONS' }
  | { type: 'ADD_TO_CLUSTER'; payload: Market }
  | { type: 'REMOVE_FROM_CLUSTER'; payload: string }
  | { type: 'CLEAR_CLUSTER' }
  | { type: 'SET_SCANNER_RESULT'; payload: ScannerResult | null }
  | { type: 'SET_DISCOUNT_RATE'; payload: number };

const initialState: StrategyState = {
  positions: [],
  clusterMarkets: [],
  scannerResult: null,
  discountRate: 0.10,
};

function strategyReducer(state: StrategyState, action: StrategyAction): StrategyState {
  switch (action.type) {
    case 'ADD_POSITION':
      if (state.positions.length >= 5) return state;
      if (state.positions.some(p => p.market.id === action.payload.market.id)) return state;
      return { ...state, positions: [...state.positions, action.payload] };
    
    case 'REMOVE_POSITION':
      return { ...state, positions: state.positions.filter(p => p.id !== action.payload) };
    
    case 'UPDATE_POSITION':
      return {
        ...state,
        positions: state.positions.map(p =>
          p.id === action.payload.id ? { ...p, ...action.payload.updates } : p
        ),
      };
    
    case 'CLEAR_POSITIONS':
      return { ...state, positions: [] };
    
    case 'ADD_TO_CLUSTER':
      if (state.clusterMarkets.length >= 10) return state;
      if (state.clusterMarkets.some(m => m.id === action.payload.id)) return state;
      return { ...state, clusterMarkets: [...state.clusterMarkets, action.payload] };
    
    case 'REMOVE_FROM_CLUSTER':
      return { ...state, clusterMarkets: state.clusterMarkets.filter(m => m.id !== action.payload) };
    
    case 'CLEAR_CLUSTER':
      return { ...state, clusterMarkets: [], scannerResult: null };
    
    case 'SET_SCANNER_RESULT':
      return { ...state, scannerResult: action.payload };
    
    case 'SET_DISCOUNT_RATE':
      return { ...state, discountRate: action.payload };
    
    default:
      return state;
  }
}

interface StrategyContextType {
  state: StrategyState;
  addPosition: (market: Market, side: 'YES' | 'NO', stake: number) => void;
  removePosition: (id: string) => void;
  updatePosition: (id: string, updates: Partial<Position>) => void;
  clearPositions: () => void;
  addToCluster: (market: Market) => void;
  removeFromCluster: (marketId: string) => void;
  clearCluster: () => void;
  setScannerResult: (result: ScannerResult | null) => void;
  setDiscountRate: (rate: number) => void;
  // Research drafts
  drafts: ResearchDraft[];
  saveDraft: (draft: Omit<ResearchDraft, 'id' | 'createdAt' | 'updatedAt'>) => void;
  deleteDraft: (id: string) => void;
}

const StrategyContext = createContext<StrategyContextType | null>(null);

export function StrategyProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(strategyReducer, initialState);
  const [drafts, setDrafts] = useLocalStorage<ResearchDraft[]>('pulseforge-drafts', []);

  const addPosition = useCallback((market: Market, side: 'YES' | 'NO', stake: number) => {
    const entryPrice = side === 'YES'
      ? market.outcomes[0]?.price || 0.5
      : market.outcomes[1]?.price || 0.5;
    
    dispatch({
      type: 'ADD_POSITION',
      payload: {
        id: generateId(),
        market,
        side,
        stake,
        entryPrice,
        addedAt: Date.now(),
      },
    });
  }, []);

  const removePosition = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_POSITION', payload: id });
  }, []);

  const updatePosition = useCallback((id: string, updates: Partial<Position>) => {
    dispatch({ type: 'UPDATE_POSITION', payload: { id, updates } });
  }, []);

  const clearPositions = useCallback(() => {
    dispatch({ type: 'CLEAR_POSITIONS' });
  }, []);

  const addToCluster = useCallback((market: Market) => {
    dispatch({ type: 'ADD_TO_CLUSTER', payload: market });
  }, []);

  const removeFromCluster = useCallback((marketId: string) => {
    dispatch({ type: 'REMOVE_FROM_CLUSTER', payload: marketId });
  }, []);

  const clearCluster = useCallback(() => {
    dispatch({ type: 'CLEAR_CLUSTER' });
  }, []);

  const setScannerResult = useCallback((result: ScannerResult | null) => {
    dispatch({ type: 'SET_SCANNER_RESULT', payload: result });
  }, []);

  const setDiscountRate = useCallback((rate: number) => {
    dispatch({ type: 'SET_DISCOUNT_RATE', payload: rate });
  }, []);

  const saveDraft = useCallback((draft: Omit<ResearchDraft, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = Date.now();
    const newDraft: ResearchDraft = {
      ...draft,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    setDrafts(prev => [newDraft, ...prev]);
  }, [setDrafts]);

  const deleteDraft = useCallback((id: string) => {
    setDrafts(prev => prev.filter(d => d.id !== id));
  }, [setDrafts]);

  return (
    <StrategyContext.Provider
      value={{
        state,
        addPosition,
        removePosition,
        updatePosition,
        clearPositions,
        addToCluster,
        removeFromCluster,
        clearCluster,
        setScannerResult,
        setDiscountRate,
        drafts,
        saveDraft,
        deleteDraft,
      }}
    >
      {children}
    </StrategyContext.Provider>
  );
}

export function useStrategy() {
  const context = useContext(StrategyContext);
  if (!context) {
    throw new Error('useStrategy must be used within StrategyProvider');
  }
  return context;
}
