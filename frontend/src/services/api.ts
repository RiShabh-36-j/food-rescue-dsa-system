import {
  DashboardStats,
  Donation,
  Recipient,
  Allocation,
  MatchRecommendation,
  GraphData,
  DijkstraResult,
  HeapState,
  HashTableState
} from '../types';

const BASE_URL = '/api';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    let errorMsg = `HTTP Error ${response.status}: ${response.statusText}`;
    try {
      const errJson = await response.json();
      if (errJson.error) errorMsg = errJson.error;
    } catch {
      // Use fallback error message
    }
    throw new Error(errorMsg);
  }

  // Handle empty bodies (e.g. CSV or 204)
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  return response.text() as unknown as T;
}

export const api = {
  // Health
  checkHealth: () => request<{ status: string; engine: string; college: string; system_time: string }>('/health'),

  // Dashboard Stats
  getDashboardStats: () => request<DashboardStats>('/dashboard/stats'),

  // Donations
  getDonations: () => request<Donation[]>('/donations'),
  getDonation: (id: string) => request<Donation>(`/donations/${id}`),
  createDonation: (donation: Partial<Donation>) =>
    request<{ success: boolean; donation: Donation }>('/donations', {
      method: 'POST',
      body: JSON.stringify(donation)
    }),
  updateDonation: (id: string, donation: Partial<Donation>) =>
    request<{ success: boolean; donation: Donation }>(`/donations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(donation)
    }),
  deleteDonation: (id: string) =>
    request<{ success: boolean; id: string }>(`/donations/${id}`, {
      method: 'DELETE'
    }),

  // Recipients
  getRecipients: () => request<Recipient[]>('/recipients'),
  createRecipient: (recipient: Partial<Recipient>) =>
    request<{ success: boolean; recipient: Recipient }>('/recipients', {
      method: 'POST',
      body: JSON.stringify(recipient)
    }),
  updateRecipient: (id: string, recipient: Partial<Recipient>) =>
    request<{ success: boolean; recipient: Recipient }>(`/recipients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(recipient)
    }),
  deleteRecipient: (id: string) =>
    request<{ success: boolean; id: string }>(`/recipients/${id}`, {
      method: 'DELETE'
    }),

  // Route Planner
  getGraph: () => request<GraphData>('/routes/graph'),
  calculateRoute: (from: string, to: string) =>
    request<DijkstraResult>(`/routes/calculate?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`),

  // Smart Matching
  previewMatching: () => request<MatchRecommendation[]>('/matching/preview', { method: 'POST' }),
  confirmMatching: (donationIds?: string[]) =>
    request<{ success: boolean; committed_count: number; allocations: Allocation[] }>('/matching/confirm', {
      method: 'POST',
      body: JSON.stringify({ donation_ids: donationIds || [] })
    }),

  // Allocations History
  getAllocations: () => request<Allocation[]>('/allocations'),
  exportAllocationsCsvUrl: () => `${BASE_URL}/allocations/export.csv`,

  // Algorithm Visualizer
  getDijkstraTrace: (from: string, to: string) =>
    request<DijkstraResult>(`/algorithms/dijkstra-trace?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`),
  getHeapState: () => request<HeapState>('/algorithms/heap-state'),
  getHashTableState: () => request<HashTableState>('/algorithms/hash-table-state'),

  // System
  resetDemoData: () => request<{ success: boolean; message: string }>('/system/reset-demo', { method: 'POST' })
};
