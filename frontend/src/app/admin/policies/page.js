'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppShell from '@/components/AppShell';
import { api } from '@/lib/api';

export default function AdminPoliciesPage() {
  const [policies, setPolicies] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('policies'); // 'policies' or 'acknowledgements'

  // Modal State for Policy Sign-offs / Acknowledgements View
  const [selectedPolicyAcks, setSelectedPolicyAcks] = useState(null); // { policy, acks: [] }

  // Modal State for Create / Edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    category: 'Access Control',
    summary: '',
    content: '',
    version: '1.0',
    isMandatory: true,
  });
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [polData, statsData] = await Promise.all([
        api('/policies/admin/all'),
        api('/policies/stats')
      ]);
      setPolicies(polData.policies || []);
      setStats(statsData || null);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load policy data');
    } finally {
      setLoading(false);
    }
  }

  const handleOpenCreateModal = () => {
    setEditingPolicy(null);
    setFormData({
      title: '',
      category: 'Access Control',
      summary: '',
      content: '',
      version: '1.0',
      isMandatory: true,
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (policy) => {
    setEditingPolicy(policy);
    setFormData({
      title: policy.title,
      category: policy.category || 'General Security',
      summary: policy.summary || '',
      content: policy.content || '',
      version: policy.version || '1.0',
      isMandatory: policy.is_mandatory ?? true,
    });
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingPolicy(null);
  };

  const handleViewPolicyAcks = (policy) => {
    const allAcks = stats?.recentAcknowledgements || [];
    const policyAcks = allAcks.filter(
      a => a.policy_id === policy.id || a.policy_title === policy.title
    );
    setSelectedPolicyAcks({
      policy,
      acks: policyAcks
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatusMessage(null);

    try {
      if (editingPolicy) {
        // Update existing policy
        const res = await api(`/policies/${editingPolicy.id}`, {
          method: 'PUT',
          body: formData
        });
        setStatusMessage({ type: 'success', text: `Policy "${res.policy.title}" updated successfully.` });
      } else {
        // Create new policy
        const res = await api('/policies', {
          method: 'POST',
          body: formData
        });
        setStatusMessage({ type: 'success', text: `Policy "${res.policy.title}" published successfully.` });
      }

      handleCloseModal();
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to save policy');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePolicy = async (policyId, policyTitle) => {
    if (!confirm(`Are you sure you want to delete policy "${policyTitle}"?`)) return;

    try {
      await api(`/policies/${policyId}`, { method: 'DELETE' });
      setStatusMessage({ type: 'success', text: `Policy "${policyTitle}" deleted.` });
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to delete policy');
    }
  };

  return (
    <ProtectedRoute roles={['admin', 'security_officer']}>
      <AppShell>
        <div className="mx-auto max-w-6xl space-y-6">

          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
                  Admin Control Panel
                </span>
              </div>
              <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
                Policy Management & Compliance
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Create and manage organizational security policies, and track employee compliance sign-offs.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <a
                href="/policies"
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
              >
                View as Employee
              </a>
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Create Policy
              </button>
            </div>
          </div>

          {/* Notification */}
          {statusMessage && (
            <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 shadow-sm animate-fade-in">
              <div className="flex items-center gap-2 text-sm font-medium">
                ✓ {statusMessage.text}
              </div>
              <button
                onClick={() => setStatusMessage(null)}
                className="text-sm text-emerald-600 hover:text-emerald-800"
              >
                ✕
              </button>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
              <p className="font-semibold">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="rounded-xl border bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Policies</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{policies.length}</p>
                <p className="mt-1 text-xs text-slate-400">Active corporate standards</p>
              </div>

              <div className="rounded-xl border bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Compliance Rate</p>
                <p className="mt-2 text-3xl font-bold text-blue-600">{stats.complianceRate}%</p>
                <p className="mt-1 text-xs text-slate-400">Across all employees</p>
              </div>

              <div className="rounded-xl border bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Confirmations</p>
                <p className="mt-2 text-3xl font-bold text-emerald-600">{stats.totalAcknowledgements}</p>
                <p className="mt-1 text-xs text-slate-400">Recorded audit logs</p>
              </div>

              <div className="rounded-xl border bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active Employees</p>
                <p className="mt-2 text-3xl font-bold text-purple-600">{stats.totalEmployees}</p>
                <p className="mt-1 text-xs text-slate-400">In organizational scope</p>
              </div>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 text-sm font-medium text-slate-600">
            <button
              type="button"
              onClick={() => setActiveTab('policies')}
              className={`border-b-2 px-5 py-3 transition ${
                activeTab === 'policies'
                  ? 'border-blue-600 font-bold text-blue-600'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              Policies List ({policies.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('acknowledgements')}
              className={`border-b-2 px-5 py-3 transition ${
                activeTab === 'acknowledgements'
                  ? 'border-blue-600 font-bold text-blue-600'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              All Employee Sign-offs ({stats?.recentAcknowledgements?.length || 0})
            </button>
          </div>

          {/* Loading Indicator */}
          {loading && (
            <div className="flex min-h-[250px] items-center justify-center rounded-xl border bg-white p-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            </div>
          )}

          {/* Policies Tab Content */}
          {!loading && activeTab === 'policies' && (
            <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b">
                    <tr>
                      <th className="px-6 py-4">Policy Title</th>
                      <th className="px-6 py-4">Category</th>
                      <th className="px-6 py-4">Version</th>
                      <th className="px-6 py-4">Mandatory</th>
                      <th className="px-6 py-4">Acknowledgements</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {policies.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-8 text-center text-slate-400">
                          No policies created yet. Click "+ Create Policy" to add your first policy.
                        </td>
                      </tr>
                    ) : (
                      policies.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/70 transition">
                          <td className="px-6 py-4">
                            <p className="font-bold text-slate-900">{p.title}</p>
                            <p className="text-xs text-slate-500 line-clamp-1">{p.summary}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                              {p.category || 'General'}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-mono text-xs text-slate-600">
                            v{p.version}
                          </td>
                          <td className="px-6 py-4">
                            {p.is_mandatory ? (
                              <span className="inline-flex rounded bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                                Yes
                              </span>
                            ) : (
                              <span className="inline-flex rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                                Optional
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <button
                              type="button"
                              onClick={() => handleViewPolicyAcks(p)}
                              title="Click to view employees who acknowledged this policy"
                              className="group inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                            >
                              <span className="text-blue-600 group-hover:underline">
                                {p.acknowledgement_count ?? 0} staff
                              </span>
                              <svg className="h-3.5 w-3.5 text-slate-400 group-hover:text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(p)}
                                className="rounded px-2.5 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 transition"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeletePolicy(p.id, p.title)}
                                className="rounded px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 transition"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Acknowledgements Tab Content */}
          {!loading && activeTab === 'acknowledgements' && (
            <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
              <div className="p-4 border-b bg-slate-50 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">
                    All Employee Policy Agreements & Audit Log
                  </h3>
                  <p className="text-xs text-slate-500">
                    Live recorded sign-offs across all active security policies.
                  </p>
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                  {stats?.recentAcknowledgements?.length || 0} Total Records
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50/50 text-xs font-semibold uppercase text-slate-500 border-b">
                    <tr>
                      <th className="px-6 py-3">Employee</th>
                      <th className="px-6 py-3">Department</th>
                      <th className="px-6 py-3">Policy Title</th>
                      <th className="px-6 py-3">Version</th>
                      <th className="px-6 py-3">Acknowledged Date</th>
                      <th className="px-6 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(!stats?.recentAcknowledgements || stats.recentAcknowledgements.length === 0) ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-8 text-center text-slate-400">
                          No employee acknowledgements recorded yet.
                        </td>
                      </tr>
                    ) : (
                      stats.recentAcknowledgements.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition">
                          <td className="px-6 py-4">
                            <p className="font-semibold text-slate-900">{item.user_name || item.user_email}</p>
                            <p className="text-xs text-slate-500">{item.user_email}</p>
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-600">
                            {item.department || 'General Staff'}
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-800">
                            {item.policy_title}
                          </td>
                          <td className="px-6 py-4 font-mono text-xs text-slate-500">
                            v{item.policy_version}
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-600">
                            {new Date(item.acknowledged_at).toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                              Confirmed
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Modal for Specific Policy Sign-offs */}
          {selectedPolicyAcks && (
            <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm animate-fade-in">
              <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden">
                
                {/* Modal Header */}
                <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
                  <div>
                    <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800">
                      Sign-off Details
                    </span>
                    <h2 className="mt-1 text-lg font-bold text-slate-900">
                      {selectedPolicyAcks.policy.title}
                    </h2>
                    <p className="text-xs text-slate-500">
                      Category: {selectedPolicyAcks.policy.category} | Version: v{selectedPolicyAcks.policy.version}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedPolicyAcks(null)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition"
                  >
                    ✕
                  </button>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto p-6">
                  {selectedPolicyAcks.acks.length === 0 ? (
                    <div className="rounded-xl border border-dashed p-8 text-center text-slate-500">
                      <p className="font-semibold text-slate-700">No staff acknowledgements yet</p>
                      <p className="mt-1 text-xs">
                        Employees haven't confirmed agreement to this policy yet.
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Confirmed Employees ({selectedPolicyAcks.acks.length})
                        </span>
                      </div>
                      <div className="overflow-hidden rounded-xl border border-slate-200">
                        <table className="w-full text-left text-sm text-slate-600">
                          <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b">
                            <tr>
                              <th className="px-4 py-3">Employee Name & Email</th>
                              <th className="px-4 py-3">Department</th>
                              <th className="px-4 py-3">Version</th>
                              <th className="px-4 py-3">Acknowledged At</th>
                              <th className="px-4 py-3">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {selectedPolicyAcks.acks.map((ack, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/70">
                                <td className="px-4 py-3">
                                  <p className="font-bold text-slate-900">{ack.user_name || ack.user_email}</p>
                                  <p className="text-xs text-slate-500">{ack.user_email}</p>
                                </td>
                                <td className="px-4 py-3 text-xs text-slate-600">
                                  {ack.department || 'General'}
                                </td>
                                <td className="px-4 py-3 font-mono text-xs">
                                  v{ack.policy_version}
                                </td>
                                <td className="px-4 py-3 text-xs text-slate-600">
                                  {new Date(ack.acknowledged_at).toLocaleString()}
                                </td>
                                <td className="px-4 py-3">
                                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                                    ✓ Agreed
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-end border-t border-slate-200 bg-slate-50 px-6 py-3.5">
                  <button
                    type="button"
                    onClick={() => setSelectedPolicyAcks(null)}
                    className="rounded-lg bg-white border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Close
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* Modal for Create / Edit Policy */}
          {modalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm animate-fade-in">
              <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden">
                
                {/* Modal Header */}
                <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
                  <h2 className="text-lg font-bold text-slate-900">
                    {editingPolicy ? `Edit Policy: ${editingPolicy.title}` : 'Create New Security Policy'}
                  </h2>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition"
                  >
                    ✕
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleFormSubmit} className="flex flex-col flex-1 overflow-hidden">
                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                        Policy Title *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g., Clean Desk & Remote Work Policy"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="mt-1.5 w-full rounded-lg border border-slate-300 p-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                          Category
                        </label>
                        <select
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          className="mt-1.5 w-full rounded-lg border border-slate-300 p-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
                        >
                          <option value="Access Control">Access Control</option>
                          <option value="Compliance & Conduct">Compliance & Conduct</option>
                          <option value="Data Privacy">Data Privacy</option>
                          <option value="Incident Management">Incident Management</option>
                          <option value="Device Security">Device Security</option>
                          <option value="Network & Cloud Security">Network & Cloud Security</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                          Version
                        </label>
                        <input
                          type="text"
                          value={formData.version}
                          onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                          placeholder="1.0"
                          className="mt-1.5 w-full rounded-lg border border-slate-300 p-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                        Short Summary
                      </label>
                      <input
                        type="text"
                        placeholder="A concise one-line description of the policy..."
                        value={formData.summary}
                        onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                        className="mt-1.5 w-full rounded-lg border border-slate-300 p-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                        Full Policy Content (Markdown Supported) *
                      </label>
                      <textarea
                        rows={8}
                        required
                        placeholder="Enter the full policy text, sections, rules, and employee guidelines..."
                        value={formData.content}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        className="mt-1.5 w-full rounded-lg border border-slate-300 p-3 text-sm font-mono text-slate-900 focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <input
                        type="checkbox"
                        id="isMandatoryCheck"
                        checked={formData.isMandatory}
                        onChange={(e) => setFormData({ ...formData, isMandatory: e.target.checked })}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="isMandatoryCheck" className="text-sm font-medium text-slate-700 cursor-pointer">
                        Mark as Mandatory (Required for employee compliance score)
                      </label>
                    </div>

                  </div>

                  {/* Modal Footer */}
                  <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition"
                    >
                      {saving ? (
                        <>
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Saving...
                        </>
                      ) : (
                        editingPolicy ? 'Update Policy' : 'Publish Policy'
                      )}
                    </button>
                  </div>
                </form>

              </div>
            </div>
          )}

        </div>
      </AppShell>
    </ProtectedRoute>
  );
}