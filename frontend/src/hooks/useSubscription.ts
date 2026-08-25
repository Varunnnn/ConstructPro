import { useQuery } from '@tanstack/react-query';
import { billingApi } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

export interface SubscriptionData {
  subscription_id: string;
  status: 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'EXPIRED' | 'PAUSED';
  billing_cycle: 'MONTHLY' | 'ANNUAL';
  trial_ends_at: string | null;
  trial_days_remaining: number;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  plan: {
    id: string;
    code: string;
    name: string;
    monthly_price: number;
    annual_price: number;
    max_projects: number;
    max_workers: number;
    max_users: number;
    is_unlimited_projects: boolean;
    is_unlimited_workers: boolean;
  };
  usage: {
    projects: { current: number; limit: number; unlimited: boolean };
    workers: { current: number; limit: number; unlimited: boolean };
    users: { current: number; limit: number; unlimited: boolean };
  };
  features: string[];
}

export function useSubscription() {
  const { isAuthenticated, user } = useAuth();
  // Don't fetch for super admins (they manage the platform, not a subscription)
  const enabled = isAuthenticated && user?.role !== 'super_admin';

  const { data, isLoading, error, refetch } = useQuery<SubscriptionData>({
    queryKey: ['subscription'],
    queryFn: async () => {
      const res = await billingApi.getSubscription();
      return res.data.data;
    },
    enabled,
    staleTime: 5 * 1000, // 5 seconds
    retry: false,
  });

  return { subscription: data, isLoading, error, refetch };
}
