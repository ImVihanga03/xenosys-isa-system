"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";

export default function TrainingPage({ params }) {
  const { id } = use(params);

  const [module, setModule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadModule() {
      try {
        const response = await fetch(`/api/modules/${id}`);
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Unable to load module");
        }

        setModule(data.module);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadModule();
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-10">
        <p>Loading training module...</p>
      </main>
    );
  }

  if (error || !module) {
    return (
      <main className="min-h-screen bg-slate-50 p-10">
        <h1 className="text-2xl font-bold">Module unavailable</h1>

        <p className="mt-3 text-slate-600">{error}</p>

        <Link
          href="/"
          className="inline-block mt-6 text-blue-600 font-medium"
        >
          ← Return to dashboard
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">

      <header className="bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-6 py-5">
          <Link
            href="/"
            className="text-sm text-slate-300 hover:text-white"
          >
            ← Training Dashboard
          </Link>
        </div>
      </header>

      <section className="max-w-4xl mx-auto px-6 py-10">

        <div className="bg-white border rounded-2xl p-8">

          <div className="flex flex-wrap gap-3 mb-5">
            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
              {module.category}
            </span>

            <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-sm">
              {module.estimated_time} minutes
            </span>
          </div>

          <h1 className="text-4xl font-bold text-slate-900">
            {module.title}
          </h1>

          <p className="mt-4 text-lg text-slate-600">
            {module.description}
          </p>

          <div className="border-t mt-8 pt-8">
            <h2 className="text-2xl font-bold text-slate-900">
              Training Content
            </h2>

            <p className="mt-4 text-slate-700 leading-8">
              {module.content}
            </p>
          </div>

          <div className="mt-10 bg-blue-50 border border-blue-100 rounded-xl p-5">
            <h3 className="font-bold text-slate-900">
              Ready to test your knowledge?
            </h3>

            <p className="text-slate-600 mt-1 text-sm">
              Complete the training material before taking the quiz.
            </p>

            <Link
              href={`/quiz/${module.module_id}`}
              className="inline-block mt-5 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition"
            >

              Take Quiz
            </Link>
          </div>

        </div>
      </section>
    </main>
  );
}