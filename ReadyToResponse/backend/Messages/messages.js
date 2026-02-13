const express = require("express");
const authenticate = require("../Authentication/Auth-Wrapper");
const {
  sendMessage,
  getMessages,
  markAsRead,
  deleteMessage
} = require("./message-controller");

const router = express.Router();

// All message routes are protected
router.use(authenticate);

// Send message (Coordinator ↔ Agency)
router.post("/", sendMessage);

// Fetch chat messages
router.get("/", getMessages);
router.delete("/:id", deleteMessage);
// Mark messages as read
router.patch("/read", markAsRead);

module.exports = router;