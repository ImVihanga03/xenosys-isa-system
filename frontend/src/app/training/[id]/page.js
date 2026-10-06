'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppShell from '@/components/AppShell';
import { api } from '@/lib/api';

export default function TrainingModulePage() {
  const params = useParams();
  const id = params.id;

  const [module, setModule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const data = await api(`/training/modules/${id}`);
        setModule(data.module);
      } catch (err) {
        setError(err.message || 'Unable to load module');
      } finally {
        setLoading(false);
      }
    }
    if (id) load();
  }, [id]);

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="p-8 max-w-4xl mx-auto">
          <Link href="/training" className="text-sm text-blue-700 hover:underline">
            ← Training Dashboard
          </Link>

          {loading && <div className="mt-6">Loading...</div>}
          {error && (
            <div className="mt-6 rounded border border-red-300 bg-red-50 p-3 text-red-700">
              {error}
            </div>
          )}

          {module && (
            <div className="mt-6 bg-white border rounded-xl p-8">
              <div className="flex gap-3 mb-4">
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
                  {module.category}
                </span>
                <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-sm">
                  {module.estimated_time} minutes
                </span>
              </div>
              <h1 className="text-3xl font-bold">{module.title}</h1>
              <p className="mt-3 text-slate-600">{module.description}</p>
              <div className="border-t mt-8 pt-8">
                <h2 className="text-xl font-bold mb-3">Training Content</h2>
                <p className="text-slate-700 leading-8 whitespace-pre-line">
                  {module.content}
                </p>
              </div>
              <div className="mt-10 bg-blue-50 border border-blue-100 rounded-xl p-5">
                <h3 className="font-bold">Ready to test your knowledge?</h3>
                <p className="text-sm text-slate-600 mt-1">
                  Complete the training material before taking the quiz.
                </p>
                <Link
                  href={`/quiz/${module.module_id}`}
                  className="inline-block mt-4 bg-blue-700 hover:bg-blue-800 text-white px-6 py-2.5 rounded-lg font-medium"
                >
                  Take Quiz
                </Link>
              </div>
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}