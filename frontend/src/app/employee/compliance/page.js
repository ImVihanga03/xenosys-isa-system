'use client';

import { useEffect, useState } from 'react';
import { getMyCompliance } from '../../../lib/api';

export default function EmployeeCompliancePage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    async function loadData() {
      const result = await getMyCompliance();
      setData(result);
    }
    loadData();
  }, []);

  if (!data) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">My Compliance Status</h1>

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
    </div>
  );
}