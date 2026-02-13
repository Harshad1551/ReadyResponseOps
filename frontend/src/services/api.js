// src/services/api.js

const BASE_URL = "http://localhost:5000";

export async function apiRequest(
  endpoint,
  { method = "GET", body } = {}
) {
  // ✅ Always read token from storage
  const token = localStorage.getItem("auth_token");

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "API request failed");
  }

  return data;
}