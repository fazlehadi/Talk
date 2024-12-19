import { useState, useRef, useEffect, useContext } from "react";
import { Context } from "../../context/Context";
import toast from "react-hot-toast";

const useWebSocket = (
  openReply,
  setOpenReply,
  handleCloseReply,
  generateShortUniqueID,
  messageInputRef
) => {
  const {
    selectedChat,
    userInfo,
    setUserInfo,
    messages,
    setMessages,
    fetchRecentChat,
  } = useContext(Context);

  const socketRef = useRef(null);

  const [websocketConnectionLoader, setWebsocketConnectionLoader] =
    useState(false);

  // Setup WebSocket connection
  useEffect(() => {
    if (!selectedChat.chat_id) return; // No chat ID, no WebSocket connection

    const setupWebSocket = async () => {
      if (socketRef.current) {
        socketRef.current.close(); // Close any existing connection
      }

      // Fetch recent chat messages for the selected chat if the messages are aleady not present
      // if (messages[selectedChat.chat_id]?.recent.length === 0) {
        await fetchRecentChat(selectedChat.chat_id); // Fetch recent messages only if not present
      // }

      // Set focus and clear the input
      messageInputRef.current.focus();
      messageInputRef.current.value = ""; // Clear input

      // Reset reply state
      setOpenReply({
        open: false,
        id: null,
      });

      const authToken = localStorage.getItem("auth-token");
      const url = `ws://localhost:8000/api/chat/continue-chat/${
        selectedChat.chat_id
      }?authToken=${encodeURIComponent(authToken)}`;
      const socket = new WebSocket(url);
      socketRef.current = socket;

      socket.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.action === "message") {
            // Update the chat with the new message in the "recent" bucket
            setMessages((prevChats) => ({
              ...prevChats,
              [selectedChat.chat_id]: {
                ...prevChats[selectedChat.chat_id],
                recent: [
                  ...(prevChats[selectedChat.chat_id]?.recent || []),
                  {
                    id: data.id,
                    action: data.action,
                    content: data.content,
                    reply_to_id: data.reply_to_id,
                    reply_to_content: data.reply_to_content,
                    sender_id: data.sender_id,
                    created_at: data.created_at,
                    seen: data.seen,
                    seen_timestamp: data.seen_timestamp,
                  },
                ],
              },
            }));

            // Update user info with the latest message summary for inbox display
            const lastMessageObj = {
              content: data.content,
              created_at: data.created_at,
              sent_by: data.sender_id,
            };

            setUserInfo((prevUserInfo) => ({
              ...prevUserInfo,
              inbox: {
                ...prevUserInfo.inbox,
                chats: prevUserInfo.inbox.chats.map((chat) =>
                  chat.chat_id === selectedChat.chat_id
                    ? { ...chat, last_message: lastMessageObj }
                    : chat
                ),
              },
            }));
          } else if (data.action === "delete") {
            // Ensure the state is up-to-date by using a callback in setMessages
            setMessages((prevMessages) => {
              let chatMessages = prevMessages[selectedChat.chat_id];

              // Initialize the selectedChat.chat_id if it doesn't exist
              if (!chatMessages) {
                chatMessages = { recent: [] }; // or any default structure you want
              }

              // Find the message location by searching within each bucket
              const messageLocation = chatMessages.recent.some(
                (message) => message.id === data.message_id
              )
                ? "recent"
                : Object.keys(chatMessages).find(
                    (bucketKey) =>
                      bucketKey !== "recent" &&
                      chatMessages[bucketKey]?.some(
                        (message) => message.id === data.message_id
                      )
                  );

              if (!messageLocation) {
                return prevMessages;
              }

              const updatedChatMessages = { ...chatMessages };

              // Remove the deleted message
              updatedChatMessages[messageLocation] = updatedChatMessages[
                messageLocation
              ].filter((message) => message.id !== data.message_id);

              // Update reply_to fields for any message that referenced the deleted message
              updatedChatMessages[messageLocation] = updatedChatMessages[
                messageLocation
              ].map((message) => {
                if (message.reply_to_id === data.message_id) {
                  return {
                    ...message,
                    reply_to_id: null,
                    reply_to_content: null,
                  };
                }
                return message;
              });

              const newMessages = {
                ...prevMessages,
                [selectedChat.chat_id]: updatedChatMessages,
              };

              // Update the userInfo after ensuring the message has been removed
              const allMessages = Object.values(
                newMessages[selectedChat.chat_id]
              ).flat();
              const messageList = allMessages.filter(
                (message) => message.id !== data.message_id
              );

              const lastMessage = messageList[messageList.length - 1];
              const lastMessageObj = lastMessage
                ? {
                    content: lastMessage.content,
                    created_at: lastMessage.created_at,
                    sent_by: lastMessage.sender_id,
                  }
                : { content: "", created_at: "", sent_by: "" }; // fallback if no message is found

              // Update userInfo's last message in the inbox
              setUserInfo((prevUserInfo) => ({
                ...prevUserInfo,
                inbox: {
                  ...prevUserInfo.inbox,
                  chats: prevUserInfo.inbox.chats.map((chat) =>
                    chat.chat_id === selectedChat.chat_id
                      ? { ...chat, last_message: lastMessageObj }
                      : chat
                  ),
                },
              }));

              return newMessages;
            });
          } else if (data.action === "seen") {
            setMessages((prevChats) => {
              const chatMessages = prevChats[selectedChat.chat_id];
              if (!chatMessages) return prevChats;

              // Create a deep copy for immutability
              const updatedRecent = chatMessages.recent.map((message) =>
                message.sender_id === userInfo._id && !message.seen
                  ? {
                      ...message,
                      seen: true,
                      seen_timestamp: data.seen_timestamp,
                    }
                  : message
              );

              return {
                ...prevChats,
                [selectedChat.chat_id]: {
                  ...chatMessages,
                  recent: updatedRecent, // Replace recent with the updated copy
                },
              };
            });
          }
        } catch (error) {
          console.error("Error parsing message:", error);
        }
      };

      socket.onerror = (error) => {
        console.error("WebSocket error:", error);
        // Try reconnecting after a delay
        setTimeout(() => {
          setupWebSocket(); // Reconnect
        }, 1000); // Adjust delay as needed
      };
    };

    setupWebSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.close(); // Ensure socket is closed on unmount or selectedChat.chat_id change
      }
    };
  }, [selectedChat.chat_id]);

  const sendMessage = async () => {
    const message = messageInputRef.current.value;
    if (message.trim() === "") return;

    if (
      message &&
      socketRef.current &&
      socketRef.current.readyState === WebSocket.OPEN
    ) {
      const messageData = JSON.stringify({
        id: generateShortUniqueID(),
        action: "message",
        content: message.trim(),
        sender_id: userInfo._id,
        reply_to_id: openReply.open ? openReply.id : null,
        reply_to_content: openReply.open ? openReply.content : null,
        created_at: new Date().toISOString(),
        seen: false,
        seen_timestamp: null,
      });

      handleCloseReply();

      socketRef.current.send(messageData);

      const lastMessageObj = {
        content: message.trim(),
        created_at: new Date().toISOString(),
        sent_by: userInfo._id,
      };

      setUserInfo((prevUserInfo) => ({
        ...prevUserInfo,
        inbox: {
          ...prevUserInfo.inbox,
          chats: prevUserInfo.inbox.chats.map((chat) =>
            chat.chat_id === selectedChat.chat_id
              ? { ...chat, last_message: lastMessageObj }
              : chat
          ),
        },
      }));

      messageInputRef.current.value = ""; // Clear input
    }
  };

  const deleteMessage = async (chatID, messageID) => {
    // Determine the chat messages structure
    const chatMessages = messages[chatID];
    if (!chatMessages) {
      return;
    }

    // Find the message location by searching within each bucket
    const messageLocation = chatMessages.recent.some(
      (message) => message.id === messageID
    )
      ? "recent"
      : Object.keys(chatMessages).find(
          (bucketKey) =>
            bucketKey !== "recent" &&
            chatMessages[bucketKey].some((message) => message.id === messageID)
        );

    if (messageLocation === undefined) {
      toast.error("Message not found", {
        duration: 2500,
        position: "top-center",
        style: {
          background: "#151515",
          border: "1px solid #2c2c2c",
          color: "#ffffff",
        },
      });
      return;
    }

    // Determine the API endpoint based on message location
    let response;
    if (messageLocation === "recent") {
      response = await fetch(
        `http://localhost:8000/api/chat/unsend-recent-message/${chatID}/${messageID}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("auth-token")}`,
          },
        }
      );
    } else {
      response = await fetch(
        `http://localhost:8000/api/chat/unsend-older-message/${chatID}/${messageID}/${messageLocation}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("auth-token")}`,
          },
        }
      );
    }

    // Handle response and update state
    if (response.ok) {
      setMessages((prevMessages) => {
        let chatMessages = prevMessages[chatID];

        // Initialize the chatID if it doesn't exist
        if (!chatMessages) {
          chatMessages = { recent: [] }; // or any default structure you want
        }

        // Find the message location by searching within each bucket
        const messageLocation = chatMessages.recent.some(
          (message) => message.id === messageID
        )
          ? "recent"
          : Object.keys(chatMessages).find(
              (bucketKey) =>
                bucketKey !== "recent" &&
                chatMessages[bucketKey]?.some(
                  (message) => message.id === messageID
                )
            );

        if (!messageLocation) {
          return prevMessages;
        }

        const updatedChatMessages = { ...chatMessages };

        // Remove the deleted message
        updatedChatMessages[messageLocation] = updatedChatMessages[
          messageLocation
        ].filter((message) => message.id !== messageID);

        // Update reply_to fields for any message that referenced the deleted message
        updatedChatMessages[messageLocation] = updatedChatMessages[
          messageLocation
        ].map((message) => {
          if (message.reply_to_id === messageID) {
            return {
              ...message,
              reply_to_id: null,
              reply_to_content: null,
            };
          }
          return message;
        });

        const newMessages = {
          ...prevMessages,
          [chatID]: updatedChatMessages,
        };

        // Update the userInfo after ensuring the message has been removed
        const allMessages = Object.values(newMessages[chatID]).flat();
        const messageList = allMessages.filter(
          (message) => message.id !== messageID
        );

        const lastMessage = messageList[messageList.length - 1];
        const lastMessageObj = lastMessage
          ? {
              content: lastMessage.content,
              created_at: lastMessage.created_at,
              sent_by: lastMessage.sender_id,
            }
          : { content: "", created_at: "", sent_by: "" }; // fallback if no message is found

        // Update userInfo's last message in the inbox
        setUserInfo((prevUserInfo) => ({
          ...prevUserInfo,
          inbox: {
            ...prevUserInfo.inbox,
            chats: prevUserInfo.inbox.chats.map((chat) =>
              chat.chat_id === chatID
                ? { ...chat, last_message: lastMessageObj }
                : chat
            ),
          },
        }));

        return newMessages;
      });

      // Display success toast notification
      toast.success("Message unsent successfully", {
        duration: 2500,
        position: "top-center",
        style: {
          background: "#151515",
          border: "1px solid #2c2c2c",
          color: "#ffffff",
        },
      });
    } else {
      // Handle error notification
      toast.error("Failed to unsend the message", {
        duration: 2500,
        position: "top-center",
        style: {
          background: "#151515",
          border: "1px solid #2c2c2c",
          color: "#ffffff",
        },
      });
    }
  };

  return {
    sendMessage,
    deleteMessage,
    websocketConnectionLoader,
  };
};

export default useWebSocket;
