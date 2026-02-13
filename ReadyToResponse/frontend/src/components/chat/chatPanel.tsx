import { useEffect, useState } from "react";
import {
  fetchMessages,
  sendMessage,
  markMessagesAsRead,
  deleteMessage,
  searchUsers,
} from "@/services/messageService";
import { useAuth } from "@/context/AuthContext";
import { socket } from "@/lib/socket";
import {
  MessageSquare,
  ArrowLeft,
  Trash2,
  Send,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

/* -------------------- TYPES -------------------- */

interface ChatMessage {
  id: number;
  sender_id: number;
  receiver_id: number;
  incident_id: number | null;
  message: string;
  is_read: boolean;
  created_at: string;

  // ✅ REQUIRED
  sender_name: string;
  sender_role: string;
  receiver_name: string;
  receiver_role: string;
}

interface Conversation {
  userId: number;
  participantName: string;
  participantRole: string;
  messages: ChatMessage[];
  unreadCount: number;
}

/* -------------------- COMPONENT -------------------- */

export function ChatPanel() {
  const { user } = useAuth();
  const myUserId = user?.id;
  const myRole = user?.role;

  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] =
    useState<Conversation | null>(null);

  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);

  /* -------------------- LOAD USERS + MESSAGES -------------------- */

useEffect(() => {
  if (!isOpen || !myUserId) return;

  const load = async () => {
    let base: Conversation[] = [];

    // 🔵 Coordinator → preload all agencies (unchanged)
    if (myRole === "coordinator") {
      const agencies = await searchUsers("");
      base = agencies
        .filter((u: any) => u.role === "agency")
        .map((u: any) => ({
          userId: u.id,
          participantName: u.name,
          participantRole: u.role,
          messages: [],
          unreadCount: 0,
        }));
    }

    const messages: ChatMessage[] = await fetchMessages();

    messages.forEach((msg) => {
      const otherUserId =
        msg.sender_id === myUserId
          ? msg.receiver_id
          : msg.sender_id;

      // 🔑 derive name & role from message itself
      const isSender = msg.sender_id === myUserId;

      const participantName = isSender
        ? msg.receiver_name
        : msg.sender_name;

      const participantRole = isSender
        ? msg.receiver_role
        : msg.sender_role;

      let conv = base.find((c) => c.userId === otherUserId);

      if (!conv) {
        conv = {
          userId: otherUserId,
          participantName,
          participantRole,
          messages: [],
          unreadCount: 0,
        };
        base.push(conv);
      }

      conv.messages.push(msg);

      if (!msg.is_read && msg.receiver_id === myUserId) {
        conv.unreadCount += 1;
      }
    });

    setConversations(base);
  };

  load();
}, [isOpen, myUserId, myRole]);

  /* -------------------- SOCKET.IO -------------------- */

/* -------------------- SOCKET.IO -------------------- */

useEffect(() => {
  if (!isOpen || !myUserId) return;

  socket.connect();

  const onNewMessage = (msg: ChatMessage) => {
    // Ignore messages not related to me
    if (
      msg.sender_id !== myUserId &&
      msg.receiver_id !== myUserId
    ) {
      return;
    }

    const otherUserId =
      msg.sender_id === myUserId
        ? msg.receiver_id
        : msg.sender_id;

    // 1️⃣ Update conversations list
    setConversations((prev) => {
      const copy = [...prev];
      let conv = copy.find((c) => c.userId === otherUserId);

      if (!conv) {
        conv = {
          userId: otherUserId,
          participantName: `User ${otherUserId}`,
          participantRole:
            myRole === "coordinator" ? "agency" : "coordinator",
          messages: [],
          unreadCount: 0,
        };
        copy.push(conv);
      }

      conv.messages = [...conv.messages, msg];

      if (msg.receiver_id === myUserId) {
        conv.unreadCount += 1;
      }

      return [...copy];
    });

    // 2️⃣ Update active chat instantly
    setActiveConversation((prev) =>
      prev && prev.userId === otherUserId
        ? { ...prev, messages: [...prev.messages, msg] }
        : prev
    );
  };

  socket.on("new_message", onNewMessage);

  return () => {
    socket.off("new_message", onNewMessage); // ✅ prevents duplicates
    socket.disconnect();
  };
}, [isOpen, myUserId, myRole]);

  /* -------------------- SEARCH USERS -------------------- */

  useEffect(() => {
    if (search.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const t = setTimeout(() => {
      searchUsers(search).then((results) => {
        const filtered = results.filter((u: any) =>
          myRole === "coordinator"
            ? u.role === "agency"
            : u.role === "coordinator"
        );
        if (myRole === "community") {
  setSearchResults([]);
  return;
}
        setSearchResults(filtered);
      });
    }, 400);

    return () => clearTimeout(t);
  }, [search, myRole]);

  /* -------------------- OPEN CHAT -------------------- */

  const openConversation = async (conv: Conversation) => {
    setActiveConversation(conv);
    await markMessagesAsRead();

    setConversations((prev) =>
      prev.map((c) =>
        c.userId === conv.userId ? { ...c, unreadCount: 0 } : c
      )
    );
  };

  /* -------------------- SEND MESSAGE -------------------- */

 const handleSend = async (text: string) => {
  if (!activeConversation || !text.trim()) return;

  // 🔑 Extract incidentId from existing messages
  const incidentId =
    activeConversation.messages[0]?.incident_id ?? null;

  await sendMessage({
    receiverId: activeConversation.userId,
    message: text,
    incidentId, // ✅ REQUIRED
  });
};

  /* -------------------- DELETE MESSAGE -------------------- */

  const handleDelete = async (id: number) => {
    await deleteMessage(id);

    setActiveConversation((prev) =>
      prev
        ? {
            ...prev,
            messages: prev.messages.filter((m) => m.id !== id),
          }
        : prev
    );
  };

  /* -------------------- RENDER -------------------- */

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <MessageSquare className="h-5 w-5" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0">
        {!activeConversation ? (
          <>
            <div className="border-b px-4 py-3 bg-muted/40">
              <h3 className="text-xs font-mono tracking-wider text-muted-foreground">
                MESSAGES
              </h3>
            </div>

            <div className="p-3 border-b">
              <Input
                placeholder={
                  myRole === "coordinator"
                    ? "Search agency..."
                    : "Search coordinator..."
                }
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <ScrollArea className="h-80">
              {(search ? searchResults : conversations).map((c: any) => (
                <button
                  key={c.userId}
                  onClick={() => openConversation(c)}
                  className="w-full flex gap-3 px-4 py-3 text-left hover:bg-accent border-b"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between">
                      <p className="text-sm font-medium truncate">
                        {c.participantName}
                      </p>
                      {c.unreadCount > 0 && (
                        <span className="h-5 w-5 rounded-full bg-primary text-[10px] flex items-center justify-center text-primary-foreground">
                          {c.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {c.messages?.length
  ? c.messages[c.messages.length - 1].message
  : "No messages yet"}
                    </p>
                    <span className="text-[10px] font-mono uppercase text-muted-foreground">
                      {c.participantRole}
                    </span>
                  </div>
                </button>
              ))}
            </ScrollArea>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 px-3 py-2 border-b bg-muted/40">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setActiveConversation(null)}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <p className="text-sm font-medium">
                  {activeConversation.participantName}
                </p>
                <span className="text-[10px] font-mono uppercase text-muted-foreground">
                  {activeConversation.participantRole}
                </span>
              </div>
            </div>

            <ScrollArea className="h-64 px-4 py-3">
              <div className="space-y-3">
                {activeConversation.messages.map((msg) => {
                  const isMe = msg.sender_id === myUserId;

                  return (
                    <div
                      key={msg.id}
                      className={`flex ${
                        isMe ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                          isMe
                            ? "bg-foreground text-background"
                            : "bg-muted border"
                        }`}
                      >
                        {msg.message}
                        <div className="flex justify-end mt-1">
                          <Trash2
                            className="h-3 w-3 cursor-pointer text-muted-foreground"
                            onClick={() => handleDelete(msg.id)}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            <div className="border-t p-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Type a message..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSend(e.currentTarget.value);
                      e.currentTarget.value = "";
                    }
                  }}
                />
                <Button size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}