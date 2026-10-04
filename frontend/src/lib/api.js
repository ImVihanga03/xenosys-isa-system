const API_BASE = 'http://localhost:5000/api';

export async function getMyCompliance() {
  const res = await fetch(`${API_BASE}/compliance/me`);
  return res.json();
}

export async function getComplianceOverview() {
  const res = await fetch(`${API_BASE}/compliance/overview`);
  return res.json();
}

export async function getPendingCompliance() {
  const res = await fetch(`${API_BASE}/compliance/pending`);
  return res.json();
}