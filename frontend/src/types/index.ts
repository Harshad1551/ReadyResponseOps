/* ===================== USER ===================== */

export type UserRole = 'community' | 'agency' | 'coordinator';

export interface User {
  id: string | number;
  email: string;
  name: string;
  role: UserRole;
  organizationName?: string;
}

/* ===================== INCIDENT ===================== */

export type IncidentSeverity = 'High' | 'Medium' | 'Low';
export type IncidentStatus = 'active' | 'pending' | 'resolved';

/**
 * Backend-safe location type
 * Supports BOTH:
 * - { latitude, longitude }  (backend)
 * - { lat, lng }             (frontend/map)
 */
export interface GeoLocation {
  latitude?: number;
  longitude?: number;
  lat?: number;
  lng?: number;
  address?: string; // Mapped from lat/lng in Dashboard
}

export interface Incident {
  id: string | number;

  /** Backend uses `category`, UI may still call it `type` */
  category?: string;
  type?: string;

  severity: IncidentSeverity;
  status: IncidentStatus;

  location: GeoLocation;

  description?: string;

  /** Backend */
  reported_by?: string;
  created_at?: string;

  /** Frontend compatibility */
  reportedBy?: string;
  reporterId?: string | number;
  reportedAt?: Date;

  assignedResources?: (string | number)[];
}

/* ===================== RESOURCE ===================== */

export type ResourceStatus = 'Available' | 'Engaged' | 'Unavailable';

export interface Resource {
  id: string | number;
  name: string;
  type: string;
  status: ResourceStatus;

  location: GeoLocation;

  assignedTo?: string | number;
  agencyId?: string | number;
}

/* ===================== ANALYTICS ===================== */

export interface AnalyticsData {
  period: 'weekly' | 'monthly' | 'yearly';
  severityDistribution: {
    severity: IncidentSeverity;
    count: number;
  }[];
  categoryDistribution: {
    category: string;
    count: number;
  }[];
  temporalPatterns: {
    date: string;
    count: number;
  }[];
}

/* ===================== NOTIFICATION ===================== */

export interface Notification {
  id: number;
  recipient_user_id: number | null;
  recipient_role: string | null;
  type: 'incident_reported' | 'resource_assigned' | 'incident_resolved' | 'resource_added';
  message: string;
  data: any;
  read: boolean;
  created_at: string;
}
