import EmojiPicker from "emoji-picker-react";
import { useState, useEffect, useRef } from "react";
import io from "socket.io-client";

const socket = io("http://localhost:3001");

function App() {
  const [screen, setScreen] = useState("welcome");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [typingUser, setTypingUser] = useState("");
  const [notification, setNotification] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);

  const chatBoxRef = useRef(null);

  useEffect(() => {
    socket.on("chat_history", (data) => {

  setMessages(data);

  // Mark unseen messages as seen
  data.forEach((msg) => {

    if (
      msg.sender !== name &&
      !msg.seen
    ) {

      socket.emit(
        "message_seen",
        msg._id
      );
    }
  });
});

   socket.on("receive_message", (data) => {

  setMessages((prev) => [
    ...prev,
    data
  ]);

  // Only receiver marks seen
  if (data.sender !== name) {

    setTimeout(() => {

      socket.emit(
        "message_seen",
        data._id
      );

    }, 1000);

  }
});

    socket.on("online_users", (count) => {
      setOnlineUsers(count);
    });

    socket.on("show_typing", (username) => {

  // Don't show my own typing indicator
  if (username === name) return;

  setTypingUser(username);
});
    socket.on("hide_typing", () => {
      setTypingUser("");
    });
    // Update seen status
socket.on(
  "message_seen_update",
  (id) => {

    setMessages((prev) =>

      prev.map((msg) =>

        msg._id === id
          ? {
              ...msg,
              seen: true,
            }
          : msg
      )
    );
  }
);


    socket.on("notification", (msg) => {
      setNotification(msg);

      setTimeout(() => {
        setNotification("");
      }, 8000);
    });
    

    return () => {
      socket.off("chat_history");
      socket.off("receive_message");
      socket.off("online_users");
      socket.off("show_typing");
      socket.off("hide_typing");
      socket.off("notification");
      socket.off(
  "message_seen_update"
);
    };
  }, [name]);

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop =
        chatBoxRef.current.scrollHeight;
    }
  }, [messages]);
 const onEmojiClick = (emojiData) => {

  setMessage((prev) => prev + emojiData.emoji);

  // Auto close emoji picker
  setShowEmoji(false);
};

  const sendMessage = () => {
    if (message.trim() === "") return;

    const messageData = {
      sender: name,
      text: message,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    socket.emit("send_message", messageData);
    socket.emit("stop_typing");

    setMessage("");
  };

  // WELCOME PAGE

  if (screen === "welcome") {
    return (
      <div className="welcome-container">
        <div className="welcome-card">
          <h1>💬 ChatConnect</h1>

          <h2>Connect. Chat. Collaborate.</h2>

          <p>
            Experience seamless real-time communication with friends,
            teammates, and communities. Send messages instantly and stay
            connected.
          </p>

          <button onClick={() => setScreen("name")}>
            Join Chat
          </button>

          <p className="footer">
            Powered by React & WebSocket Technology
          </p>
        </div>
      </div>
    );
  }

  // NAME PAGE

  if (screen === "name") {
    return (
      <div className="welcome-container">
        <div className="welcome-card">
          <h1>Enter Your Name</h1>

          <input
            type="text"
            className="name-input"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <br />

          <button
            onClick={() => {
              if (name.trim() !== "") {
                socket.emit("user_joined", name);
                setScreen("chat");
              }
            }}
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  // CHAT PAGE

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2>💬 ChatConnect</h2>

        <span className="online">
          🟢 {onlineUsers} User{onlineUsers !== 1 ? "s" : ""} Online
        </span>
      </div>

      <div className="today-label">
        Today
      </div>

      {notification && (
        <div
          style={{
            textAlign: "center",
            color: "#94a3b8",
            marginTop: "10px",
            fontStyle: "italic",
          }}
        >
          {notification}
        </div>
      )}

      <div className="chat-box" ref={chatBoxRef}>
        {messages.map((msg, index) => (
          <div
            key={index}
            className={
              msg.sender === name
                ? "message-row my-row"
                : "message-row other-row"
            }
          >
            <div className="avatar">
              {msg.sender.charAt(0).toUpperCase()}
            </div>

            <div
              className={
                msg.sender === name
                  ? "my-message"
                  : "other-message"
              }
            >
              <div className="sender">
                {msg.sender}
              </div>

              <div className="text">
                {msg.text}
              </div>

              <div className="time">

  {msg.time}

  {msg.sender === name && (
  <span>

    {msg.seen ? "✔✔" : "✔"}
  </span>
)}
</div>
            </div>
          </div>
        ))}

        {typingUser && (
          <div className="typing-indicator">
            ✍️ {typingUser} is typing...
          </div>
        )}
      </div>

<div className="chat-input">

  <button
    className="emoji-btn"
    onClick={() => setShowEmoji(!showEmoji)}
  >
    😀
  </button>

  <input
    type="text"
    placeholder="Type a message..."
    value={message}
    onChange={(e) => {
      setMessage(e.target.value);

      if (e.target.value !== "") {
        socket.emit("typing", name);
      } else {
        socket.emit("stop_typing");
      }
    }}
    onKeyDown={(e) => {
      if (e.key === "Enter") {
        sendMessage();
      }
    }}
  />

  <button onClick={sendMessage}>
    Send
  </button>

</div>

{showEmoji && (
  <div className="emoji-picker-container">
    <EmojiPicker onEmojiClick={onEmojiClick} />
  </div>
)}
    </div>
  );
}

export default App;