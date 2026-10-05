'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppShell from '@/components/AppShell';
import { api } from '@/lib/api';

export default function EmployeeCompliancePage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const result = await api('/compliance/me');
        setData(result);
      } catch (err) {
        console.error(err);
        setError(err.message || 'Failed to load compliance data');
      }
    }
    loadData();
  }, []);

  return (
    <ProtectedRoute roles={['employee', 'admin', 'security_officer']}>
      <AppShell>
        <div className="p-8">
          <h1 className="text-2xl font-bold mb-6">My Compliance Status</h1>

          {error && (
            <div className="mb-4 rounded border border-red-300 bg-red-50 p-3 text-red-700">
              {error}
            </div>
          )}

          {!data && !error && <div>Loading...</div>}

          {data && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
              <div className="border p-4 rounded">
                <p className="text-sm text-gray-500">Policy Acknowledged</p>
                <p className="text-xl font-bold">
                  {data.policyAcknowledged ? 'Yes' : 'No'}
                </p>
              </div>

              <div className="border p-4 rounded">
                <p className="text-sm text-gray-500">Training Completed</p>
                <p className="text-xl font-bold">
                  {data.trainingCompleted ? 'Yes' : 'No'}
                </p>
              </div>

              <div className="border p-4 rounded">
                <p className="text-sm text-gray-500">Quiz Score</p>
                <p className="text-xl font-bold">
                  {data.quizScore !== null ? data.quizScore : 'Not taken'}
                </p>
              </div>

              <div className="border p-4 rounded">
                <p className="text-sm text-gray-500">Overall Status</p>
                <p className="text-xl font-bold">{data.overallStatus}</p>
              </div>
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}