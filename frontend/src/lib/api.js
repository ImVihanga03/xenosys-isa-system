export async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
    method, credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.message || 'Request failed'),
                                   { status: res.status, code: data.code, data });
  return data;
}