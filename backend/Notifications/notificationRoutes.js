const express = require("express");
const router = express.Router();
const authenticate = require("../Authentication/Auth-Wrapper");
const { getNotifications, markRead, markAllRead } = require("./notificationController");

router.get("/", authenticate, getNotifications);
router.put("/:id/read", authenticate, markRead);
router.put("/read-all", authenticate, markAllRead);

module.exports = router;
