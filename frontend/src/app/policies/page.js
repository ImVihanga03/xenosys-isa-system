'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppShell from '@/components/AppShell';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

export default function PoliciesPage() {
  const { user } = useAuth();
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [agreeCheck, setAgreeCheck] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [statusFilter, setStatusFilter] = useState('all'); // all, pending, acknowledged

  useEffect(() => {
    fetchPolicies();
  }, []);

  async function fetchPolicies() {
    setLoading(true);
    setError(null);
    try {
      const data = await api('/policies');
      setPolicies(data.policies || []);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load security policies');
    } finally {
      setLoading(false);
    }
  }

  const handleOpenPolicy = (policy) => {
    setSelectedPolicy(policy);
    setAgreeCheck(false);
    setSuccessMsg(null);
  };

  const handleClosePolicy = () => {
    setSelectedPolicy(null);
    setAgreeCheck(false);
  };

  const handleAcknowledge = async (e) => {
    e.preventDefault();
    if (!agreeCheck || !selectedPolicy) return;

    setSubmitting(true);
    try {
      await api(`/policies/${selectedPolicy.id}/acknowledge`, { method: 'POST' });
      
      // Update local state immediately
      setPolicies(prev =>
        prev.map(p =>
          p.id === selectedPolicy.id
            ? { ...p, is_acknowledged: true, acknowledged_at: new Date().toISOString() }
            : p
        )
      );

      setSelectedPolicy(prev => ({
        ...prev,
        is_acknowledged: true,
        acknowledged_at: new Date().toISOString()
      }));

      setSuccessMsg(`Policy "${selectedPolicy.title}" acknowledged successfully.`);
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err) {
      alert(err.message || 'Failed to acknowledge policy');
    } finally {
      setSubmitting(false);
    }
  };

  const categories = ['All', ...new Set(policies.map(p => p.category).filter(Boolean))];

  const filteredPolicies = policies.filter(p => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.summary && p.summary.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'acknowledged' && p.is_acknowledged) ||
      (statusFilter === 'pending' && !p.is_acknowledged);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const mandatoryPolicies = policies.filter(p => p.is_mandatory);
  const acknowledgedMandatory = mandatoryPolicies.filter(p => p.is_acknowledged).length;
  const progressPercent = mandatoryPolicies.length > 0
    ? Math.round((acknowledgedMandatory / mandatoryPolicies.length) * 100)
    : 100;

  const totalAcknowledged = policies.filter(p => p.is_acknowledged).length;

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="mx-auto max-w-6xl space-y-6">
          
          {/* Header Banner */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                Security Policies & Standards
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Review and acknowledge corporate security policies to maintain regulatory and internal compliance.
              </p>
            </div>

            {['admin', 'security_officer'].includes(user?.role) && (
              <a
                href="/admin/policies"
                className="inline-flex items-center gap-2 self-start rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Manage / Add Policies
              </a>
            )}
          </div>

          {/* Success Notification */}
          {successMsg && (
            <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 shadow-sm animate-fade-in">
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">{successMsg}</span>
              </div>
              <button
                onClick={() => setSuccessMsg(null)}
                className="text-sm text-emerald-600 hover:text-emerald-800"
              >
                ✕
              </button>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
              <div className="flex items-center gap-2 font-semibold">
                <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Failed to load policies
              </div>
              <p className="mt-1 text-sm">{error}</p>
            </div>
          )}

          {/* Compliance Progress Overview Card */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <div className="rounded-xl border bg-white p-5 shadow-sm md:col-span-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                    Your Policy Compliance Status
                  </h3>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    progressPercent === 100
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {progressPercent === 100 ? 'Fully Compliant' : 'Action Required'}
                  </span>
                </div>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {acknowledgedMandatory} of {mandatoryPolicies.length} Mandatory Policies Acknowledged
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Employees are required to read and confirm agreement with all mandatory information security policies.
                </p>
              </div>

              <div className="mt-4">
                <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
                  <span>Mandatory Completion</span>
                  <span>{progressPercent}%</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      progressPercent === 100 ? 'bg-emerald-500' : 'bg-blue-600'
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-xl border bg-white p-5 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                  Policy Summary
                </h3>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Total Policies:</span>
                    <span className="font-semibold text-slate-900">{policies.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Acknowledged:</span>
                    <span className="font-semibold text-emerald-600">{totalAcknowledged}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Pending Action:</span>
                    <span className="font-semibold text-amber-600">
                      {policies.length - totalAcknowledged}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 border-t pt-3 text-xs text-slate-500">
                Logged in as <strong className="text-slate-700">{user?.name || user?.email}</strong>
              </div>
            </div>
          </div>

          {/* Filter and Search Bar */}
          <div className="flex flex-col gap-3 rounded-xl border bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <svg
                className="absolute left-3.5 top-3 h-4 w-4 text-slate-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search policies by title, category or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-lg border bg-slate-50 p-1 text-xs font-medium text-slate-600">
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`rounded-md px-3 py-1 transition ${
                    statusFilter === 'all'
                      ? 'bg-white text-blue-700 shadow-sm font-semibold'
                      : 'hover:text-slate-900'
                  }`}
                >
                  All ({policies.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('pending')}
                  className={`rounded-md px-3 py-1 transition ${
                    statusFilter === 'pending'
                      ? 'bg-white text-amber-700 shadow-sm font-semibold'
                      : 'hover:text-slate-900'
                  }`}
                >
                  Pending ({policies.filter(p => !p.is_acknowledged).length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('acknowledged')}
                  className={`rounded-md px-3 py-1 transition ${
                    statusFilter === 'acknowledged'
                      ? 'bg-white text-emerald-700 shadow-sm font-semibold'
                      : 'hover:text-slate-900'
                  }`}
                >
                  Acknowledged ({totalAcknowledged})
                </button>
              </div>

              {categories.length > 2 && (
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-blue-500 focus:outline-none"
                >
                  {categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border bg-white p-12 text-center shadow-sm">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
              <p className="mt-3 text-sm font-medium text-slate-600">Loading security policies...</p>
            </div>
          )}

          {/* Policies Grid */}
          {!loading && (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {filteredPolicies.length === 0 ? (
                <div className="col-span-full rounded-xl border border-dashed bg-white p-12 text-center shadow-sm">
                  <svg className="mx-auto h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-slate-900">No policies found</h3>
                  <p className="mt-1 text-xs text-slate-500">Try adjusting your search query or filters.</p>
                </div>
              ) : (
                filteredPolicies.map(policy => (
                  <div
                    key={policy.id}
                    className={`flex flex-col justify-between rounded-xl border bg-white p-6 shadow-sm transition hover:shadow-md ${
                      policy.is_acknowledged
                        ? 'border-slate-200'
                        : 'border-amber-200 bg-amber-50/20'
                    }`}
                  >
                    <div>
                      {/* Top badging */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                          {policy.category || 'General Security'}
                        </span>
                        
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-slate-400">v{policy.version}</span>
                          {policy.is_mandatory && (
                            <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">
                              Mandatory
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Title & Summary */}
                      <h3 className="mt-3 text-lg font-bold text-slate-900">
                        {policy.title}
                      </h3>
                      <p className="mt-2 line-clamp-3 text-sm text-slate-600">
                        {policy.summary || policy.content?.slice(0, 140) + '...'}
                      </p>
                    </div>

                    {/* Bottom Status & Action */}
                    <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                      {policy.is_acknowledged ? (
                        <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                          <svg className="h-4 w-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span>
                            Acknowledged
                            {policy.acknowledged_at && (
                              <span className="text-slate-400 ml-1">
                                ({new Date(policy.acknowledged_at).toLocaleDateString()})
                              </span>
                            )}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs font-medium text-amber-700">
                          <span className="inline-block h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                          <span>Action Pending</span>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => handleOpenPolicy(policy)}
                        className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                          policy.is_acknowledged
                            ? 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                            : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                        }`}
                      >
                        {policy.is_acknowledged ? 'View Policy' : 'Read & Acknowledge'}
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Policy Detail & Confirmation Modal */}
          {selectedPolicy && (
            <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm animate-fade-in">
              <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-100">
                
                {/* Modal Header */}
                <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                        {selectedPolicy.category || 'General Security'}
                      </span>
                      <span className="text-xs font-medium text-slate-500">
                        Version {selectedPolicy.version}
                      </span>
                      {selectedPolicy.is_mandatory && (
                        <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">
                          Mandatory
                        </span>
                      )}
                    </div>
                    <h2 className="mt-1 text-xl font-bold text-slate-900">
                      {selectedPolicy.title}
                    </h2>
                  </div>
                  
                  <button
                    onClick={handleClosePolicy}
                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition"
                    aria-label="Close modal"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Modal Content - Policy Document */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 text-slate-800">
                  {selectedPolicy.summary && (
                    <div className="rounded-lg bg-blue-50/60 border border-blue-100 p-3.5 text-sm text-blue-900 font-medium">
                      📌 <strong>Summary:</strong> {selectedPolicy.summary}
                    </div>
                  )}

                  {/* Render content */}
                  <div className="prose prose-slate max-w-none text-sm leading-relaxed whitespace-pre-line font-sans bg-slate-50/40 p-4 rounded-xl border border-slate-200">
                    {selectedPolicy.content}
                  </div>
                </div>

                {/* Modal Footer / Acknowledgment Form */}
                <div className="border-t border-slate-200 bg-slate-50 px-6 py-4">
                  {selectedPolicy.is_acknowledged ? (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-sm text-emerald-800 font-medium">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                          ✓
                        </div>
                        <div>
                          <p>You acknowledged this policy.</p>
                          {selectedPolicy.acknowledged_at && (
                            <p className="text-xs text-slate-500">
                              Recorded on {new Date(selectedPolicy.acknowledged_at).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleClosePolicy}
                        className="rounded-lg border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        Close
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleAcknowledge} className="space-y-4">
                      <div className="rounded-lg border border-slate-200 bg-white p-3.5">
                        <label className="flex items-start gap-3 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={agreeCheck}
                            onChange={(e) => setAgreeCheck(e.target.checked)}
                            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            required
                          />
                          <span className="text-xs text-slate-700 leading-normal">
                            I confirm that I have read, understood, and agree to abide by the terms and requirements outlined in <strong>{selectedPolicy.title}</strong>. I understand that compliance is mandatory for continued system access.
                          </span>
                        </label>
                      </div>

                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs text-slate-500">
                          Signed as: <strong className="text-slate-800">{user?.name || user?.email}</strong>
                        </p>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={handleClosePolicy}
                            className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={!agreeCheck || submitting}
                            className={`inline-flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold text-white shadow-sm transition ${
                              !agreeCheck || submitting
                                ? 'bg-slate-300 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                          >
                            {submitting ? (
                              <>
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                Submitting...
                              </>
                            ) : (
                              'Confirm & Acknowledge'
                            )}
                          </button>
                        </div>
                      </div>
                    </form>
                  )}
                </div>

              </div>
            </div>
          )}

        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
