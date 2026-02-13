import { apiRequest } from './api';
import { Notification } from '@/types';

export const notificationService = {
    getNotifications: async (): Promise<{ notifications: Notification[]; unreadCount: number }> => {
        // @ts-ignore
        const response = await apiRequest('/notifications');
        return response;
    },

    markAsRead: async (id: string | number): Promise<Notification> => {
        // @ts-ignore
        const response = await apiRequest(`/notifications/${id}/read`, { method: 'PUT' });
        return response;
    },

    markAllAsRead: async (): Promise<{ message: string }> => {
        // @ts-ignore
        const response = await apiRequest('/notifications/read-all', { method: 'PUT' });
        return response;
    },
};

