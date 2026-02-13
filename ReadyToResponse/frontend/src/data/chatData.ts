export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'agency' | 'coordinator';
  content: string;
  timestamp: Date;
}

export interface ChatConversation {
  id: string;
  participantId: string;
  participantName: string;
  participantRole: 'agency' | 'coordinator';
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  messages: ChatMessage[];
}

export const mockConversations: ChatConversation[] = [
  {
    id: 'conv-1',
    participantId: 'user-coord-1',
    participantName: 'Sarah Chen',
    participantRole: 'coordinator',
    lastMessage: 'Please confirm resource deployment for the downtown incident.',
    lastMessageTime: new Date(Date.now() - 10 * 60 * 1000),
    unreadCount: 2,
    messages: [
      {
        id: 'msg-1',
        senderId: 'user-coord-1',
        senderName: 'Sarah Chen',
        senderRole: 'coordinator',
        content: 'Good morning. We have a developing situation downtown.',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
      },
      {
        id: 'msg-2',
        senderId: 'current-user',
        senderName: 'You',
        senderRole: 'agency',
        content: 'Understood. What resources do you need?',
        timestamp: new Date(Date.now() - 25 * 60 * 1000),
      },
      {
        id: 'msg-3',
        senderId: 'user-coord-1',
        senderName: 'Sarah Chen',
        senderRole: 'coordinator',
        content: 'We need Engine 7 and Ambulance 3 deployed immediately.',
        timestamp: new Date(Date.now() - 20 * 60 * 1000),
      },
      {
        id: 'msg-4',
        senderId: 'user-coord-1',
        senderName: 'Sarah Chen',
        senderRole: 'coordinator',
        content: 'Please confirm resource deployment for the downtown incident.',
        timestamp: new Date(Date.now() - 10 * 60 * 1000),
      },
    ],
  },
  {
    id: 'conv-2',
    participantId: 'user-agency-1',
    participantName: 'Mike Torres',
    participantRole: 'agency',
    lastMessage: 'Engine 5 is back in service.',
    lastMessageTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
    unreadCount: 0,
    messages: [
      {
        id: 'msg-5',
        senderId: 'user-agency-1',
        senderName: 'Mike Torres',
        senderRole: 'agency',
        content: 'Engine 5 maintenance complete.',
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
      },
      {
        id: 'msg-6',
        senderId: 'current-user',
        senderName: 'You',
        senderRole: 'coordinator',
        content: 'Great. Update the system status.',
        timestamp: new Date(Date.now() - 2.5 * 60 * 60 * 1000),
      },
      {
        id: 'msg-7',
        senderId: 'user-agency-1',
        senderName: 'Mike Torres',
        senderRole: 'agency',
        content: 'Engine 5 is back in service.',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
    ],
  },
  {
    id: 'conv-3',
    participantId: 'user-coord-2',
    participantName: 'James Wilson',
    participantRole: 'coordinator',
    lastMessage: 'Shelter capacity update needed by EOD.',
    lastMessageTime: new Date(Date.now() - 5 * 60 * 60 * 1000),
    unreadCount: 1,
    messages: [
      {
        id: 'msg-8',
        senderId: 'user-coord-2',
        senderName: 'James Wilson',
        senderRole: 'coordinator',
        content: 'Shelter capacity update needed by EOD.',
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
      },
    ],
  },
];
