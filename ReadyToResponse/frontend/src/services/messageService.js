import { apiRequest } from "./api";

/* -------------------- MESSAGES -------------------- */

export const fetchMessages = () => {
  return apiRequest("/messages");
};

export const sendMessage = ({ receiverId, message, incidentId = null }) => {
  return apiRequest("/messages", {
    method: "POST",
    body: {
      receiverId,
      message,
      incidentId,
    },
  });
};

export const markMessagesAsRead = () => {
  return apiRequest("/messages/read", {
    method: "PATCH",
  });
};

export const deleteMessage = (id) => {
  return apiRequest(`/messages/${id}`, {
    method: "DELETE",
  });
};

/* -------------------- USERS -------------------- */

export const searchUsers = (query) => {
  return apiRequest(`/users/search?query=${query}`);
};