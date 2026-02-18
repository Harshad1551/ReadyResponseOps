const API_BASE = import.meta.env.VITE_API_URL;

export async function createResource(resource, token) {
  const res = await fetch(`${API_BASE}/resources/create-resource`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(resource),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Failed to create resource");
  }

  return data;
}

/* ===================== FETCH ALL RESOURCES ===================== */
export async function getResources(token) {
  const res = await fetch(`${API_BASE}/resources/resource-dashboard`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Failed to fetch resources");
  }

  return data;
}

/* ===================== UPDATE RESOURCE STATUS ===================== */
export async function updateResourceStatus(resourceId, status, token) {
  const res = await fetch(
    `${API_BASE}/resources/${resourceId}/status`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Failed to update resource status");
  }

  return data;
}
