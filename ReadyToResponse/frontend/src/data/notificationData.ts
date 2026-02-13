export interface Notification {
  id: string;
  type: 'incident_reported' | 'resource_added' | 'resource_assigned';
  title: string;
  description: string;
  referenceId: string;
  referenceType: 'incident' | 'resource';
  timestamp: Date;
  read: boolean;
}

export const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'incident_reported',
    title: 'New Incident Reported',
    description: 'Structure fire reported at 742 Evergreen Terrace',
    referenceId: 'inc-001',
    referenceType: 'incident',
    timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    read: false,
  },
  {
    id: '2',
    type: 'resource_assigned',
    title: 'Resource Assigned',
    description: 'Engine 7 assigned to Medical Emergency at Downtown Plaza',
    referenceId: 'inc-002',
    referenceType: 'incident',
    timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
    read: false,
  },
  {
    id: '3',
    type: 'resource_added',
    title: 'New Resource Available',
    description: 'Ambulance Unit 12 added to the system',
    referenceId: 'res-003',
    referenceType: 'resource',
    timestamp: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
    read: false,
  },
  {
    id: '4',
    type: 'incident_reported',
    title: 'New Incident Reported',
    description: 'Traffic collision on Highway 101 near Exit 24',
    referenceId: 'inc-004',
    referenceType: 'incident',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    read: true,
  },
  {
    id: '5',
    type: 'resource_assigned',
    title: 'Resource Assigned',
    description: 'Search Team Alpha assigned to Missing Person case',
    referenceId: 'inc-005',
    referenceType: 'incident',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    read: true,
  },
  {
    id: '6',
    type: 'resource_added',
    title: 'New Resource Available',
    description: 'Emergency Shelter C opened at Community Center',
    referenceId: 'res-006',
    referenceType: 'resource',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
    read: true,
  },
];
