'use client';

import { useState, useEffect, useReducer } from 'react';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import PageMeta from '@/components/common/PageMeta';
import ComponentCard from '@/components/common/ComponentCard';
import OvertimeHistoryTable from '@/components/overtime/OvertimeHistoryTable';
import OvertimeHistoryCard from '@/components/overtime/OvertimeHistoryCard';
import InitialLoadingScreen from '@/components/common/InitialLoadingScreen';

interface OvertimeRecord {
  id: string;
  workDate: string;
  requestedMinutes: number;
  approvedMinutes: number | null;
  status: string;
  reason: string;
  remarks: string | null;
  approvedByUser?: {
    email: string;
  } | null;
  approvedAt: string | null;
}

interface State {
  overtimeRecords: OvertimeRecord[];
  loading: boolean;
  initialLoading: boolean;
  error: string | null;
}

type Action =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_INITIAL_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_RECORDS'; payload: OvertimeRecord[] };

const initialState: State = {
  overtimeRecords: [],
  loading: false,
  initialLoading: true,
  error: null,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_INITIAL_LOADING':
      return { ...state, initialLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_RECORDS':
      return { ...state, overtimeRecords: action.payload };
    default:
      return state;
  }
}

export default function OTHistoryPage() {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    fetchOvertimeHistory();
  }, []);

  const fetchOvertimeHistory = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      const response = await fetch('/api/overtime-requests', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch overtime history');
      }

      const data = await response.json();
      dispatch({ type: 'SET_RECORDS', payload: data.data || [] });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err.message : 'An error occurred' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
      dispatch({ type: 'SET_INITIAL_LOADING', payload: false });
    }
  };

  // Initial loading screen
  if (state.initialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <PageBreadcrumb
            pageTitle="Overtime History"
            breadcrumbs={[
              { label: 'Overtime', href: '/overtime' },
              { label: 'History' }
            ]}
          />
          <InitialLoadingScreen
            title="Overtime History"
            loadingText="Loading overtime history..."
          />
        </div>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title="Overtime History - HR Management System"
        description="View your overtime request history"
      />
      <PageBreadcrumb
        pageTitle="Overtime History"
        breadcrumbs={[
          { label: 'Overtime', href: '/overtime' },
          { label: 'History' }
        ]}
      />

      {/* Content Container */}
      <div className="w-full overflow-x-auto">
        {state.error ? (
          <ComponentCard title="">
            <div className="text-center py-8">
              <p className="text-error-500 mb-4">Error loading overtime history</p>
              <p className="text-gray-600 dark:text-gray-400">{state.error}</p>
              <button
                onClick={fetchOvertimeHistory}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Try Again
              </button>
            </div>
          </ComponentCard>
        ) : (
          <ComponentCard title="Overtime History" size="full">
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 mb-4">
              View all your overtime requests and their current status
            </p>

            {/* Desktop Table View */}
            <div className="hidden md:block">
              <OvertimeHistoryTable records={state.overtimeRecords} />
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4 p-4">
              {state.overtimeRecords.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No overtime requests found
                </div>
              ) : (
                state.overtimeRecords.map((record) => (
                  <OvertimeHistoryCard key={record.id} record={record} />
                ))
              )}
            </div>
          </ComponentCard>
        )}
      </div>
    </>
  );
}
