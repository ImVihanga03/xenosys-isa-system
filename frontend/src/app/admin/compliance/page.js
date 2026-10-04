'use client';

import { useEffect, useState } from 'react';
import { getComplianceOverview, getPendingCompliance } from '../../../lib/api';

export default function AdminCompliancePage() {
  const [overview, setOverview] = useState(null);
  const [pending, setPending] = useState([]);

  useEffect(() => {
    async function loadData() {
      const overviewData = await getComplianceOverview();
      const pendingData = await getPendingCompliance();
      setOverview(overviewData);
      setPending(pendingData);
    }
    loadData();
  }, []);

  if (!overview) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Admin Compliance Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="border p-4 rounded">
          <p className="text-sm text-gray-500">Overall Compliance</p>
          <p className="text-2xl font-bold">{overview.overallCompliance}%</p>
        </div>
        <div className="border p-4 rounded">
          <p className="text-sm text-gray-500">Policy Compliance</p>
          <p className="text-2xl font-bold">{overview.policyCompliance}%</p>
        </div>
        <div className="border p-4 rounded">
          <p className="text-sm text-gray-500">Training Compliance</p>
          <p className="text-2xl font-bold">{overview.trainingCompliance}%</p>
        </div>
        <div className="border p-4 rounded">
          <p className="text-sm text-gray-500">Quiz Pass Rate</p>
          <p className="text-2xl font-bold">{overview.quizPassRate}%</p>
        </div>
      </div>

      <h2 className="text-xl font-semibold mb-4">Pending Employees</h2>
      <table className="w-full border">
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
    </div>
  );
}