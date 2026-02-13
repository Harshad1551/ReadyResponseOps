// src/services/authService.js

import { apiRequest } from "./api";

export function loginService(email, password) {
  return apiRequest("/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

export function signupService(
  name,
  email,
  password,
  role,
  organizationName
) {
  return apiRequest("/auth/signup", {
    method: "POST",
    body: {
      name,
      email,
      password,
      role,
      organization_name: organizationName || null,
    },
  });
}
