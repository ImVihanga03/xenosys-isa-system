'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppShell from '@/components/AppShell';
import { api } from '@/lib/api';

export default function CompliancePage() {
  const [overview, setOverview] = useState(null);
  const [pending, setPending] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const overviewData = await api('/compliance/overview');
        const pendingData = await api('/compliance/pending');
        setOverview(overviewData);
        setPending(pendingData);
      } catch (err) {
        console.error(err);
        setError(err.message || 'Failed to load data');
      }
    }
    loadData();
  }, []);

  return (
    <ProtectedRoute roles={['admin', 'security_officer']}>
      <AppShell>
        <div className="p-8">
          <h1 className="text-2xl font-bold mb-6">Admin Compliance Dashboard</h1>

          {error && (
            <div className="mb-4 rounded border border-red-300 bg-red-50 p-3 text-red-700">
              {error}
            </div>
          )}

          {!overview && !error && <div>Loading...</div>}

          {overview && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="border p-4 rounded bg-white">
                  <p className="text-sm text-gray-500">Overall Compliance</p>
                  <p className="text-2xl font-bold">{overview.overallCompliance}%</p>
                </div>
                <div className="border p-4 rounded bg-white">
                  <p className="text-sm text-gray-500">Policy Compliance</p>
                  <p className="text-2xl font-bold">{overview.policyCompliance}%</p>
                </div>
                <div className="border p-4 rounded bg-white">
                  <p className="text-sm text-gray-500">Training Compliance</p>
                  <p className="text-2xl font-bold">{overview.trainingCompliance}%</p>
                </div>
                <div className="border p-4 rounded bg-white">
                  <p className="text-sm text-gray-500">Quiz Pass Rate</p>
                  <p className="text-2xl font-bold">{overview.quizPassRate}%</p>
                </div>
              </div>

              <h2 className="text-xl font-semibold mb-4">Pending Employees</h2>
              <table className="w-full border bg-white">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2 text-left">Name</th>
                    <th className="border p-2 text-left">Pending Items</th>
                  </tr>
                </thead>
                <tbody>
                  {pending.map((emp) => (
                    <tr key={emp.id}>
                      <td className="border p-2">{emp.name}</td>
                      <td className="border p-2">{emp.pending.join(', ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}