"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
  const [modules, setModules] = useState([]);
  const [summary, setSummary] = useState({
    totalModules: 0,
    completedModules: 0,
    remainingModules: 0,
    progressPercentage: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProgress() {
      try {
        const response = await fetch("/api/progress", {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Failed to load training progress."
          );
        }

        setModules(data.modules);
        setSummary(data.summary);
      } catch (err) {
        console.error("Dashboard error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadProgress();
  }, []);

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">
            Loading Training Dashboard...
          </h1>

          <p className="text-slate-500 mt-2">
            Loading your training progress.
          </p>
        </div>
      </main>
    );
  }

  // =========================================================
  // ERROR
  // =========================================================

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white border rounded-2xl p-10 max-w-lg text-center">
          <h1 className="text-2xl font-bold text-red-600">
            Unable to Load Dashboard
          </h1>

          <p className="text-slate-600 mt-3">
            {error}
          </p>

          <button
            onClick={() => window.location.reload()}
            className="mt-6 bg-slate-900 text-white px-6 py-3 rounded-lg cursor-pointer"
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  // =========================================================
  // DASHBOARD
  // =========================================================

  return (
    <main className="min-h-screen bg-slate-50">

      {/* HEADER */}
      <header className="bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <p className="text-blue-300 font-medium">
            Employee Security Portal
          </p>

          <h1 className="text-3xl font-bold mt-1">
            Security Awareness Training
          </h1>

          <p className="text-slate-300 mt-2">
            Complete your assigned cybersecurity training modules
            and knowledge checks.
          </p>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-10">

        {/* =====================================================
            PROGRESS
        ===================================================== */}

        <section className="bg-white border rounded-2xl p-7 shadow-sm">

          <div className="flex justify-between items-center mb-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Overall Progress
              </h2>

              <p className="text-slate-500 mt-1">
                Your security awareness training progress
              </p>
            </div>

            <div className="text-3xl font-bold text-blue-700">
              {summary.progressPercentage}%
            </div>
          </div>

          {/* PROGRESS BAR */}
          <div className="w-full bg-slate-200 rounded-full h-4 mt-6 overflow-hidden">
            <div
              className="bg-blue-700 h-4 rounded-full transition-all duration-500"
              style={{
                width: `${summary.progressPercentage}%`,
              }}
            />
          </div>

          {/* STATISTICS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-7">

            <div className="bg-slate-50 rounded-xl p-5">
              <p className="text-slate-500 text-sm">
                Total Modules
              </p>

              <p className="text-3xl font-bold text-slate-900 mt-1">
                {summary.totalModules}
              </p>
            </div>

            <div className="bg-green-50 rounded-xl p-5">
              <p className="text-green-700 text-sm">
                Completed
              </p>

              <p className="text-3xl font-bold text-green-700 mt-1">
                {summary.completedModules}
              </p>
            </div>

            <div className="bg-orange-50 rounded-xl p-5">
              <p className="text-orange-700 text-sm">
                Remaining
              </p>

              <p className="text-3xl font-bold text-orange-700 mt-1">
                {summary.remainingModules}
              </p>
            </div>

          </div>
        </section>

        {/* =====================================================
            TRAINING MODULES
        ===================================================== */}

        <section className="mt-10">

          <div className="mb-5">
            <h2 className="text-2xl font-bold text-slate-900">
              Training Modules
            </h2>

            <p className="text-slate-500 mt-1">
              Select a module to continue your training.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {modules.map((module) => {
              const completed = module.status === "COMPLETED";

              return (
                <div
                  key={module.module_id}
                  className="bg-white border rounded-2xl p-6 shadow-sm"
                >

                  {/* CATEGORY + STATUS */}
                  <div className="flex justify-between gap-3 items-start">

                    <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                      {module.category}
                    </span>

                    {completed ? (
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold">
                        ✓ Completed
                      </span>
                    ) : module.status === "IN_PROGRESS" ? (
                      <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-bold">
                        In Progress
                      </span>
                    ) : (
                      <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-sm font-medium">
                        Not Started
                      </span>
                    )}

                  </div>

                  {/* TITLE */}
                  <h3 className="text-xl font-bold text-slate-900 mt-5">
                    {module.title}
                  </h3>

                  {/* DESCRIPTION */}
                  <p className="text-slate-600 mt-2 min-h-[48px]">
                    {module.description}
                  </p>

                  {/* INFORMATION */}
                  <div className="mt-5 flex gap-5 text-sm text-slate-500">

                    <span>
                      ⏱ {module.estimated_time} minutes
                    </span>

                    {module.best_score !== null && (
                      <span>
                        Best Score:{" "}
                        <strong className="text-slate-700">
                          {module.best_score}%
                        </strong>
                      </span>
                    )}

                  </div>

                  {/* BUTTON */}
                  <Link
                    href={`/training/${module.module_id}`}
                    className={`block text-center mt-6 px-5 py-3 rounded-lg font-medium transition ${
                      completed
                        ? "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"
                        : "bg-blue-700 text-white hover:bg-blue-800"
                    }`}
                  >
                    {completed
                      ? "Review Training"
                      : module.status === "IN_PROGRESS"
                      ? "Continue Training"
                      : "Start Training"}
                  </Link>

                </div>
              );
            })}

          </div>
        </section>

      </div>
    </main>
  );
}