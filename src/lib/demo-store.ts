'use client';

import { useEffect, useState } from 'react';
import {
  adminCards,
  adminCustomers,
  adminHealth,
  adminReports,
  adminTransactions,
  adminTransfers,
  adminAuditEvents,
  demoAccounts,
  demoActivity,
  demoCards,
  demoNotifications,
  demoPortfolio,
  demoProfile,
  demoTransactions,
  demoTransfers,
  demoUsers,
  initialSettings,
  type Account,
  type AdminSettings,
  type Card,
  type CustomerSummary,
  type Notification,
  type PortfolioItem,
  type Profile,
  type Transaction,
  type Transfer,
  type User,
} from './demo-data';

const STORAGE_KEY = 'atlas-demo-state';

export type DemoState = {
  user: User | null;
  accounts: Account[];
  transactions: Transaction[];
  transfers: Transfer[];
  cards: Card[];
  portfolio: PortfolioItem[];
  notifications: Notification[];
  profile: Profile;
  activity: string[];
  customers: CustomerSummary[];
  adminTransactions: typeof adminTransactions;
  adminTransfers: typeof adminTransfers;
  adminCards: typeof adminCards;
  adminAuditEvents: typeof adminAuditEvents;
  adminReports: typeof adminReports;
  adminHealth: typeof adminHealth;
  settings: AdminSettings;
};

const defaultState: DemoState = {
  user: null,
  accounts: demoAccounts,
  transactions: demoTransactions,
  transfers: demoTransfers,
  cards: demoCards,
  portfolio: demoPortfolio,
  notifications: demoNotifications,
  profile: demoProfile,
  activity: demoActivity,
  customers: adminCustomers,
  adminTransactions,
  adminTransfers,
  adminCards,
  adminAuditEvents,
  adminReports,
  adminHealth,
  settings: initialSettings,
};

function readStoredState(): DemoState {
  if (typeof window === 'undefined') {
    return defaultState;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw) as Partial<DemoState>;
    return {
      ...defaultState,
      ...parsed,
    };
  } catch {
    return defaultState;
  }
}

function persistState(state: DemoState) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function getDemoState(): DemoState {
  return readStoredState();
}

export function getCurrentUser() {
  return getDemoState().user;
}

export function login(email: string, password: string) {
  const user = demoUsers.find((item) => item.email === email && item.password === password) ?? null;
  if (!user) return null;
  const state = getDemoState();
  const nextState = { ...state, user };
  persistState(nextState);
  return user;
}

export function logout() {
  const state = getDemoState();
  const nextState = { ...state, user: null };
  persistState(nextState);
}

export function getAccounts() {
  return getDemoState().accounts;
}

export function getAccount(id: string) {
  return getDemoState().accounts.find((account) => account.id === id) ?? null;
}

export function getTransactions() {
  return getDemoState().transactions;
}

export function getTransfers() {
  return getDemoState().transfers;
}

export function createTransfer(payload: Omit<Transfer, 'id' | 'reference' | 'date' | 'status'>) {
  const state = getDemoState();
  const transfer: Transfer = {
    ...payload,
    id: `trf-${Date.now()}`,
    reference: `TRF-${Math.floor(Math.random() * 9000 + 1000)}`,
    date: new Date().toISOString().slice(0, 10),
    status: 'Pending',
  };
  const nextState = { ...state, transfers: [transfer, ...state.transfers] };
  persistState(nextState);
  return transfer;
}

export function getCards() {
  return getDemoState().cards;
}

export function freezeCard(cardId: string) {
  const state = getDemoState();
  const nextState = {
    ...state,
    cards: state.cards.map((card) =>
      card.id === cardId ? { ...card, status: 'FROZEN' as const } : card,
    ),
  };
  persistState(nextState);
}

export function unfreezeCard(cardId: string) {
  const state = getDemoState();
  const nextState = {
    ...state,
    cards: state.cards.map((card) =>
      card.id === cardId ? { ...card, status: 'ACTIVE' as const } : card,
    ),
  };
  persistState(nextState);
}

export function getPortfolio() {
  return getDemoState().portfolio;
}

export function getNotifications() {
  return getDemoState().notifications;
}

export function markNotificationRead(id: string) {
  const state = getDemoState();
  const nextState = {
    ...state,
    notifications: state.notifications.map((notification) =>
      notification.id === id ? { ...notification, read: true } : notification,
    ),
  };
  persistState(nextState);
}

export function getCustomers() {
  return getDemoState().customers;
}

export function getCustomer(id: string) {
  return getDemoState().customers.find((customer) => customer.id === id) ?? null;
}

export function updateProfile(profile: Profile) {
  const state = getDemoState();
  const nextState = { ...state, profile };
  persistState(nextState);
}

export function updateSettings(settings: AdminSettings) {
  const state = getDemoState();
  const nextState = { ...state, settings };
  persistState(nextState);
}

export function useDemoState() {
  const [state, setState] = useState<DemoState>(defaultState);

  useEffect(() => {
    setState(readStoredState());
  }, []);

  return state;
}
