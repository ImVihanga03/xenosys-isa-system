'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppShell from '@/components/AppShell';
import { api } from '@/lib/api';

export default function TrainingPage() {
  const [modules, setModules] = useState([]);
  const [summary, setSummary] = useState({
    totalModules: 0,
    completedModules: 0,
    remainingModules: 0,
    progressPercentage: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const data = await api('/training/progress');
        setModules(data.modules || []);
        setSummary(data.summary || summary);
      } catch (err) {
        setError(err.message || 'Failed to load training');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="p-8 max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold mb-2">Security Awareness Training</h1>
          <p className="text-slate-500 mb-8">
            Complete your assigned cybersecurity training modules and quizzes.
          </p>

          {error && (
            <div className="mb-4 rounded border border-red-300 bg-red-50 p-3 text-red-700">
              {error}
            </div>
          )}

          {loading && <div>Loading...</div>}

          {!loading && !error && (
            <>
              <div className="bg-white border rounded-xl p-6 mb-8">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-xl font-bold">Overall Progress</h2>
                  <span className="text-3xl font-bold text-blue-700">
                    {summary.progressPercentage}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-blue-700 h-3 rounded-full"
                    style={{ width: `${summary.progressPercentage}%` }}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-sm text-slate-500">Total</p>
                    <p className="text-2xl font-bold">{summary.totalModules}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-sm text-green-700">Completed</p>
                    <p className="text-2xl font-bold text-green-700">
                      {summary.completedModules}
                    </p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4">
                    <p className="text-sm text-orange-700">Remaining</p>
                    <p className="text-2xl font-bold text-orange-700">
                      {summary.remainingModules}
                    </p>
                  </div>
                </div>
              </div>

              <h2 className="text-xl font-bold mb-4">Training Modules</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {modules.map((module) => {
                  const completed = module.status === 'COMPLETED';
                  return (
                    <div key={module.module_id} className="bg-white border rounded-xl p-6">
                      <div className="flex justify-between gap-3">
                        <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
                          {module.category}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            completed
                              ? 'bg-green-100 text-green-700'
                              : module.status === 'IN_PROGRESS'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {completed
                            ? 'Completed'
                            : module.status === 'IN_PROGRESS'
                            ? 'In Progress'
                            : 'Not Started'}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold mt-4">{module.title}</h3>
                      <p className="text-slate-600 mt-2 text-sm">{module.description}</p>
                      <p className="text-slate-500 text-sm mt-3">
                        {module.estimated_time} minutes
                        {module.best_score != null && ` · Best: ${module.best_score}%`}
                      </p>
                      <Link
                        href={`/training/${module.module_id}`}
                        className={`block text-center mt-5 px-4 py-2.5 rounded-lg font-medium ${
                          completed
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : 'bg-blue-700 text-white hover:bg-blue-800'
                        }`}
                      >
                        {completed
                          ? 'Review Training'
                          : module.status === 'IN_PROGRESS'
                          ? 'Continue Training'
                          : 'Start Training'}
                      </Link>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}