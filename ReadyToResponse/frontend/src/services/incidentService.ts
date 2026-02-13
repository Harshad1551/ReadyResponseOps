// src/services/incidentService.ts
import { apiRequest } from "./api";
// @ts-ignore
import { Incident, Resource } from "@/types";

export const getIncident = (token: string | null) => {
  console.log("getIncident")
  console.log(token)
  return apiRequest("/incidents/incident-detail", {
    method: "GET",
    token,
  });
};


export const reportIncident = (data: any, token: string | null) => {
  return apiRequest("/incidents/incidents-report", {
    method: "POST",
    body: data,
    token,
  });
};

export const assignResourceToIncident = (incidentId: string | number, resourceId: string | number, token: string) => {
  return apiRequest(`/incidents/${incidentId}/assign-resource`, {
    method: "POST",
    body: { resourceId },
    token,
  });
};

export const resolveIncident = (incidentId: string | number, token: string) => {
  return apiRequest(`/incidents/${incidentId}/resolve`, {
    method: "POST",
    token,
  });
};

export const getResources = (token: string | null) => {
  return apiRequest("/resources", {
    method: "GET",
    token,
  });
};
