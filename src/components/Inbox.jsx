import React, { useContext, useEffect, useRef, useState } from "react";
import * as Separator from "@radix-ui/react-separator";
import {
  Info,
  Phone,
  Reply,
  Search,
  Send,
  Trash2,
  User,
  Video,
  X,
} from "lucide-react";
import { Context } from "../context/Context";
import toast, { Toaster } from "react-hot-toast";
import * as Dialog from "@radix-ui/react-dialog";
import Sidebar from "../utils/Sidebar";
import useWebSocket from "../utils/custom-hooks/WebsocketManager";
import useChatScrollHandler from "../utils/custom-hooks/HandleScroll";

export default function Inbox() {
  const {
    searchUsers,
    setLoader,
    loader,
    createChat,
    userInfo,
    participantsInfo,
    fetchUserInfo,
    deleteChat,
    fetchOlderChat,
    messages,
    setMessages,
    selectedChat,
    setSelectedChat,
    markAsSeen,
  } = useContext(Context);

  const searchInputRef = useRef(null);
  const messageInputRef = useRef(null);
  const debounceTimeoutRef = useRef(null);
  const scrollableDivRef = useRef(null);

  const [searchValue, setSearchValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [loader2, setLoader2] = useState(false);
  const [openReply, setOpenReply] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  // Helper function to format ISO timestamp as relative time
  function getRelativeTime(isoTimestamp) {
    const now = new Date();
    const messageDate = new Date(isoTimestamp);
    const timeDiffMs = now - messageDate;

    // Calculate time differences in seconds, minutes, hours, days, and years
    const seconds = Math.floor(timeDiffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30); // Approximate months
    const years = Math.floor(days / 365);

    // Return appropriate time format based on the difference
    if (seconds < 60) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 30) return `${days}d ago`;
    if (months < 12) return `${months}mo ago`;
    return `${years}y ago`;
  }

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  const participant = participantsInfo.find(
    (user) => user._id === selectedChat.participant_id
  );

  const handleDeleteChat = async () => {
    const response = await deleteChat(selectedChat.chat_id);

    if (response.status === 200) {
      // Remove the chat messages from the state
      setMessages((prevMessages) => {
        const updatedMessages = { ...prevMessages };
        delete updatedMessages[selectedChat.chat_id];
        return updatedMessages;
      });

      await fetchUserInfo();

      setSelectedChat({ chat_id: null, participant_id: null });

      // Show success toast notification
      toast.success("Chat deleted successfully", {
        duration: 2500,
        position: "top-center",
        style: {
          background: "#151515",
          border: "1px solid #2c2c2c",
          color: "#ffffff",
        },
      });
    } else {
      // Show error toast notification
      toast.error("Failed to delete chat", {
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

  const showRepliedMessage = async (e) => {
    const messageID = e.currentTarget.id;

    // Flatten the buckets into one array of messages
    const allMessages = Object.values(messages.messages[selectedChat.chat_id]).flat().reverse();

    // Find the message across all buckets
    let matchedMessage = allMessages.find(
      (message) => message.id === messageID
    );

    // If the message is not found, fetch older messages until we find it
    let bucketIndex =
      Object.keys(messages.chats[selectedChat.chat_id]).length - 1;

    while (!matchedMessage) {
      const data = await fetchOlderChat(selectedChat.chat_id, bucketIndex);
      const newBucket = data.bucket.messages;

      // Merge the new bucket into the state
      setMessages((prev) => ({
        ...prev,
        chats: [
          ...prev.chats,
          [selectedChat.chat_id]: {
            ...prev.chats[selectedChat.chat_id],
            [bucketIndex]: newBucket,
          },
        ],
        messages: {
          ...prev.messages,
        [selectedChat.chat_id]: {
          ...prev[selectedChat.chat_id],
          [bucketIndex]: newBucket,
        },
      }));

      // Recalculate the full array of messages
      matchedMessage = newBucket.find((message) => message.id === messageID);

      if (matchedMessage) break;

      bucketIndex--;
    }

    // Scroll to the matched message
    if (matchedMessage) {
      const waitForMessageElement = (id, callback) => {
        const element = document.getElementById(id);
        if (element) {
          callback(element);
        } else {
          setTimeout(() => waitForMessageElement(id, callback), 100);
        }
      };

      waitForMessageElement(`message-${messageID}`, (messageElement) => {
        messageElement.scrollIntoView({ block: "center" });
        messageElement.classList.add("highlight");
        setTimeout(() => messageElement.classList.remove("highlight"), 800);
      });
    }
  };

  const handleReplyClick = (e) => {
    const messageID = e.currentTarget.id;

    // Flatten the buckets into one array of messages
    const allMessages = Object.values(messages[selectedChat.chat_id]).flat();

    // Find the message across all the buckets
    const matchedMessage = allMessages.find(
      (message) => message.id === messageID
    );

    if (matchedMessage) {
      setOpenReply({
        open: true,
        id: messageID,
        content: matchedMessage.content,
        sender_id: matchedMessage.sender_id,
      });
    } else {
      setOpenReply({
        open: true,
        id: messageID,
        content: "Message not found",
        sender_id: null,
      });
    }

    messageInputRef.current.focus();
  };

  const handleCloseReply = () => {
    setOpenReply({
      open: false,
      id: null,
    });
  };

  async function handleAccountClick(searchedAccount, chatID, participantID) {
    if (searchedAccount) {
      const response = await createChat(participantID);
      await fetchUserInfo();

      setSearchValue("");

      setSelectedChat({
        chat_id: response.chat_id,
        participant_id: participantID,
      });
    } else {
      setSelectedChat({
        chat_id: chatID,
        participant_id: participantID,
      });
    }
  }

  function generateShortUniqueID() {
    // Get high-resolution timestamp (milliseconds since 1970, base36 encoded)
    const timestamp = Date.now().toString(36); // Base36 encoding makes it shorter

    // Generate a random salt (6 chars of randomness)
    const randomSalt = Math.random().toString(36).substring(2, 8); // 6 random chars

    // Combine timestamp and random salt
    return `${timestamp}-${randomSalt}`;
  }

  const isOnlyEmojis = (content) => {
    // Adjusted regex to exclude any non-emoji characters (letters, numbers, punctuation)
    const emojiRegex =
      /^(?:\p{Emoji_Presentation}|\p{Emoji}\uFE0F|\p{Extended_Pictographic}|\s)+$/u;

    // Check if the content contains only emojis and spaces
    const isEmojisOnly = emojiRegex.test(content);

    // Use Intl.Segmenter to count grapheme clusters for complex emojis
    const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" });
    const emojiCount = Array.from(segmenter.segment(content)).length;

    // Apply large style only if it's a pure emoji message with up to 20 emojis
    return isEmojisOnly && emojiCount <= 20;
  };

  console.log(messages);

  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current); // Clear any previous timeout
    }

    if (searchValue) {
      setLoader(true);
      setSearchResults([]); // Reset previous results

      // Set a new timeout to send the request after 500ms of inactivity
      debounceTimeoutRef.current = setTimeout(() => {
        searchUsers(searchValue)
          .then((results) => {
            setSearchResults(results); // Store search results
          })
          .finally(() => {
            setLoader(false); // Loader turns off after the request completes
          });
      }, 500); // 500ms delay
    } else {
      setLoader(false); // No need for loader when searchValue is empty
      setSearchResults([]); // Clear results if search value is empty
    }

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current); // Cleanup timeout on unmount
      }
    };
  }, [searchValue]);

  useEffect(() => {
    (async () => {
      if (messages[selectedChat.chat_id]) {
        // Clone current messages state to avoid direct mutation
        const timestamp = new Date().toISOString();
        let localMessages = { ...messages }; // Clone messages locally

        // Only update messages in the `recent` bucket
        const updatedRecentMessages = localMessages[
          selectedChat.chat_id
        ].recent.map((message) => {
          if (message.sender_id !== userInfo._id && !message.seen) {
            return { ...message, seen: true, seen_timestamp: timestamp }; // Update seen status
          }
          return message; // Leave unchanged if already seen or sent by the user
        });

        // Check if any updates were made
        const hasUnseenMessages = updatedRecentMessages.some(
          (message) => message.seen_timestamp === timestamp
        );

        if (hasUnseenMessages) {
          // Apply local changes to messages state
          setMessages((prevMessages) => ({
            ...prevMessages,
            [selectedChat.chat_id]: {
              ...prevMessages[selectedChat.chat_id],
              recent: updatedRecentMessages,
            },
          }));

          // Sync with server
          await markAsSeen(selectedChat.chat_id, timestamp);
        }
      }
    })();
  }, [messages, selectedChat.chat_id]);

  const { sendMessage, deleteMessage, websocketConnectionLoader } =
    useWebSocket(
      openReply,
      setOpenReply,
      handleCloseReply,
      generateShortUniqueID,
      messageInputRef
    );

  useChatScrollHandler(scrollableDivRef);

  return (
    <>
      <div className="flex">
        <div className="left w-[600px] mt-[43px]">
          <div className="search-input-container relative">
            <Search
              className="h-[18px] w-[18px] absolute left-11 top-1/2 transform -translate-y-1/2"
              strokeWidth={1.5}
              color="#989898"
            />
            <input
              type="text"
              className="rounded-xl border border-border bg-background py-2 pl-10 pr-4 outline-none mx-auto block w-[400px] focus:ring-[2px] focus:ring-[#636363] focus:border-transparent transition duration-200 my-8 placeholder-[#989898]"
              placeholder="Search"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={(e) => {
                if (!searchInputRef.current.contains(e.relatedTarget)) {
                  setIsFocused(false);
                }
              }}
            />
            {isFocused && (
              <div
                className="search-results w-[400px] h-[250px] backdrop-blur-xl bg-background/40 border border-border absolute top-full left-8 p-2 rounded-xl flex flex-col z-10"
                ref={searchInputRef}
                onMouseDown={(e) => e.preventDefault()} // Prevent input blur on clicking the dropdown
              >
                {searchValue && searchResults.length > 0 ? (
                  searchResults.map((user, index) => (
                    <div
                      key={index}
                      id={user._id}
                      className="account cursor-pointer w-full hover:bg-gray-500/10 focus:bg-gray-500/10 transition-colors flex items-center p-3 rounded-xl"
                      onClick={() => handleAccountClick(true, null, user._id)}
                    >
                      {user.profile_image ? (
                        <div className="left-section rounded-full h-12 w-12 overflow-hidden">
                          <img
                            src={user.profile_image}
                            alt="User Profile"
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="border border-border rounded-full h-12 w-12 flex items-center justify-center">
                          <User
                            className="h-6 w-6"
                            strokeWidth={2}
                            color="#ffffff"
                          />
                        </div>
                      )}
                      <div className="right-section ml-3 flex items-center">
                        <div>
                          <p className="text-[12px]">{user.username}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : loader ? (
                  <div className="h-full w-full flex items-center justify-center">
                    <div className="loader w-3"></div>
                  </div>
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-[#989898]">
                    No accounts with that username exist
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="inbox overflow-y-auto h-[800px] custom-scrollbar pr-1">
            {/* <div className="chat cursor-pointer w-full h-24 hover:bg-[#202020] focus:bg-[#202020] transition-colors flex items-center px-7">
              <div className="left-section rounded-full h-16 w-16 overflow-hidden">
                <img
                  src="https://plus.unsplash.com/premium_photo-1689551670902-19b441a6afde?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="right-section ml-5 flex-auto flex justify-between items-center">
                <div>
                  <p className="">Nia</p>
                  <p className="font-semibold ">Hey</p>
                </div>
                <div className="h-3 w-3 bg-primary rounded-full"></div>
              </div>
            </div> */}
            {participantsInfo.map(
              (user, index) =>
                !userInfo.inbox.chats[index].deleted && (
                  <div
                    className="chat cursor-pointer w-full h-24 hover:bg-[#202020] focus:bg-[#202020] transition-colors flex items-center px-7"
                    onClick={() =>
                      handleAccountClick(
                        false,
                        userInfo.inbox.chats[index].chat_id,
                        userInfo.inbox.chats[index].participant_id
                      )
                    }
                    key={index}
                  >
                    {user.profile_image ? (
                      <div className="left-section rounded-full h-16 w-16 overflow-hidden">
                        <img
                          src={user.profile_image}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="border border-border rounded-full h-16 w-16 flex items-center justify-center">
                        <User
                          className="h-8 w-8"
                          strokeWidth={2}
                          color="#ffffff"
                        />
                      </div>
                    )}
                    <div className="right-section ml-5 flex-auto flex justify-between items-center">
                      <div>
                        <p className="">{user.username}</p>
                        <p className="text-[#989898] max-w-[290px] overflow-hidden text-ellipsis whitespace-nowrap">
                          {userInfo.inbox.chats[index].last_message && (
                            <>
                              {userInfo.inbox.chats[index].last_message
                                .sent_by === userInfo._id
                                ? "You: "
                                : ""}
                              {userInfo.inbox.chats[index].last_message.content}
                              {" · "}
                              {getRelativeTime(
                                userInfo.inbox.chats[index].last_message
                                  .created_at
                              )}
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )
            )}
            <div className="chat cursor-pointer w-full h-24 hover:bg-[#202020] focus:bg-[#202020] transition-colors flex items-center px-7">
              <div className="left-section rounded-full h-16 w-16 overflow-hidden">
                <img
                  src="https://image.shutterstock.com/display_pic_with_logo/82956/82956,1293161871,19/stock-photo-varanasi-india-nov-old-indian-man-poses-for-his-portrait-in-old-city-on-nov-in-67828900.jpg"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="right-section ml-5 flex-auto flex justify-between items-center">
                <div>
                  <p className="">Majid</p>
                  <p className="text-[#989898]">Dekhooga</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Separator.Root
          className="bg-border data-[orientation=vertical]:w-px h-screen z-10"
          decorative
          orientation="vertical"
        />
        <div className="right w-full">
          {participant && (
            <>
              <div className="top-section py-2 flex items-center px-7 w-full border border-border border-t-0 border-l-0 border-r-0 mt-[50px]">
                {participant.profile_image ? (
                  <div className="rounded-full h-12 w-12 overflow-hidden">
                    <img
                      src={participant.profile_image}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="border border-border rounded-full h-12 w-12 flex items-center justify-center">
                    <User className="h-6 w-6" strokeWidth={2} color="#ffffff" />
                  </div>
                )}
                <p className="ml-4">{participant.username}</p>
                <div className="ml-auto flex items-center">
                  <button className="mr-2 p-2">
                    <Phone
                      className="h-[20px] w-[20px]"
                      strokeWidth={2}
                      color="#dadada"
                    />
                  </button>
                  <button className="p-2 mr-2">
                    <Video
                      className="h-[20px] w-[20px]"
                      strokeWidth={2}
                      color="#dadada"
                    />
                  </button>
                  <button onClick={toggleSidebar} className="p-2">
                    <div className="relative h-[25px] w-[25px] flex items-center justify-center">
                      <Info
                        className={`${
                          isSidebarOpen
                            ? "h-[25px] w-[25px]"
                            : "h-[20px] w-[20px]"
                        }`}
                        strokeWidth={2}
                        color={isSidebarOpen ? "#121212" : "#dadada"}
                        fill={isSidebarOpen ? "#fff" : null}
                      />
                    </div>
                  </button>
                </div>
              </div>
            </>
          )}
          {selectedChat.chat_id ? (
            <div className="flex">
              <div
                className={`transition-margin duration-100 ease-out w-full ${
                  isSidebarOpen ? "mr-96" : "mr-0"
                }`}
              >
                {selectedChat.chat_id && loader2 ? (
                  <div className="bg-background w-full h-[calc(100vh-200px)] flex items-center justify-center">
                    <div className="loader w-4"></div>
                  </div>
                ) : (
                  <>
                    <div
                      className={`chatbox w-full ${
                        openReply.open ? "mb-16 h-[calc(100vh-238px)]" : "mb-5"
                      } h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar py-10`}
                      ref={scrollableDivRef}
                    >
                      {loader && (
                        <div className="h-16 w-full flex items-center justify-center">
                          <div className="loader w-3"></div>
                        </div>
                      )}
                      {messages[selectedChat.chat_id] &&
                        (() => {
                          const allMessages = Object.keys(
                            messages[selectedChat.chat_id]
                          )
                            .sort((a, b) => {
                              if (a === "recent") return 1;
                              if (b === "recent") return -1;
                              return Number(b) - Number(a);
                            })
                            .flatMap(
                              (bucketKey) =>
                                messages[selectedChat.chat_id][bucketKey] || []
                            )
                            .filter((message) => message);

                          let lastSeenMessage = null;
                          let lastUnseenMessageIndex = null;

                          // Traverse messages to determine the seen indicator placement
                          allMessages.forEach((message, index) => {
                            if (message.sender_id === userInfo._id) {
                              if (message.seen) {
                                lastSeenMessage = message;
                              } else if (lastUnseenMessageIndex === null) {
                                lastUnseenMessageIndex = index; // Mark the index of the first unseen message
                              }
                            }
                          });

                          return allMessages.map((message, index) => {
                            const showSeenIndicator =
                              lastSeenMessage &&
                              message.id === lastSeenMessage.id &&
                              (lastUnseenMessageIndex === null ||
                                index < lastUnseenMessageIndex) &&
                              allMessages
                                .slice(
                                  index + 1,
                                  lastUnseenMessageIndex || allMessages.length
                                )
                                .every((msg) => msg.sender_id === userInfo._id);

                            return (
                              <div key={message.id}>
                                {message.sender_id === userInfo._id ? (
                                  <>
                                    {/* Check if the message has a reply */}
                                    {message.reply_to_id && (
                                      <>
                                        <div className="flex justify-end mr-10 mb-1">
                                          <p className="text-[#989898] text-[12px]">
                                            You replied to{" "}
                                            {Object.values(
                                              messages[selectedChat.chat_id]
                                            )
                                              .flat()
                                              .find(
                                                (msg) =>
                                                  msg.id === message.reply_to_id
                                              )?.sender_id === userInfo._id
                                              ? "yourself"
                                              : participant.username}
                                          </p>
                                        </div>
                                        <div className="flex justify-end items-center mb-2">
                                          <div
                                            className={`reply-message py-2 px-4 rounded-3xl max-w-[600px] overflow-hidden text-ellipsis whitespace-nowrap ${
                                              isOnlyEmojis(
                                                message.reply_to_content
                                              )
                                                ? "text-4xl"
                                                : "bg-[#313131] mr-2"
                                            }`}
                                            onClick={(e) =>
                                              showRepliedMessage(e)
                                            }
                                            id={message.reply_to_id}
                                          >
                                            {message.reply_to_content}
                                          </div>
                                          <div className="h-10 w-[6px] bg-[#313131] rounded-full mr-6"></div>
                                        </div>
                                      </>
                                    )}
                                    <div className="flex justify-end group mb-2">
                                      <div className="mine-message-options hidden group-hover:flex group-hover:items-center space-x-2">
                                        <button
                                          className="px-2 h-10 rounded-full hover:bg-[#d3171728] transition-colors"
                                          onClick={() =>
                                            deleteMessage(
                                              selectedChat.chat_id,
                                              message.id
                                            )
                                          }
                                        >
                                          <Trash2
                                            className="h-6 w-6"
                                            strokeWidth={1.5}
                                            color="#d01717"
                                          />
                                        </button>
                                        <button
                                          className="px-[6px] h-10 rounded-full hover:bg-[#2c2c2c] transition-colors"
                                          onClick={(e) => handleReplyClick(e)}
                                          id={message.id}
                                        >
                                          <Reply
                                            className="h-7 w-7"
                                            strokeWidth={1.5}
                                            color="#ffffff"
                                          />
                                        </button>
                                      </div>
                                      <div
                                        className={`py-2 px-4 inline-block rounded-3xl mine-message message max-w-[600px] break-words whitespace-normal transition-all ${
                                          isOnlyEmojis(message.content)
                                            ? "text-4xl"
                                            : "bg-primary last mr-6 ml-2"
                                        }`}
                                        id={`message-${message.id}`}
                                      >
                                        {message.content}
                                      </div>
                                    </div>

                                    {/* Seen Indicator */}
                                    {showSeenIndicator && (
                                      <div className="text-xs text-[#989898] font-medium mr-6 text-end my-3">
                                        Seen{" "}
                                        {getRelativeTime(
                                          lastSeenMessage.seen_timestamp
                                        )}
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <>
                                    {/* Check if the matched user has a reply */}
                                    {message.reply_to_id && (
                                      <>
                                        <div className="flex justify-start ml-7 mb-1">
                                          <p className="text-[#989898] text-[12px]">
                                            {participant.username} replied to{" "}
                                            {Object.values(
                                              messages[selectedChat.chat_id]
                                            )
                                              .flat()
                                              .find(
                                                (msg) =>
                                                  msg.id === message.reply_to_id
                                              )?.sender_id === userInfo._id
                                              ? "you"
                                              : "themself"}
                                          </p>
                                        </div>
                                        <div className="flex justify-start items-center mb-2">
                                          <div className="h-10 w-[6px] bg-[#313131] rounded-full ml-6"></div>
                                          <div
                                            className={`reply-message py-2 px-4 rounded-3xl max-w-[600px] overflow-hidden text-ellipsis whitespace-nowrap ${
                                              isOnlyEmojis(
                                                message.reply_to_content
                                              )
                                                ? "text-4xl"
                                                : "bg-[#313131] ml-2"
                                            }`}
                                            onClick={(e) =>
                                              showRepliedMessage(e)
                                            }
                                            id={message.reply_to_id}
                                          >
                                            {message.reply_to_content}
                                          </div>
                                        </div>
                                      </>
                                    )}
                                    <div className="flex justify-start group mb-6">
                                      <div
                                        className={`py-2 px-4 inline-block rounded-3xl your-message message max-w-[600px] break-words whitespace-normal transition-all ${
                                          isOnlyEmojis(message.content)
                                            ? "text-4xl"
                                            : "bg-[#313131] last ml-6 mr-2"
                                        }`}
                                        id={`message-${message.id}`}
                                      >
                                        {message.content}
                                      </div>
                                      <div className="your-message-options hidden group-hover:flex group-hover:items-center space-x-2">
                                        <button
                                          className="px-[6px] h-10 rounded-full hover:bg-[#2c2c2c] transition-colors"
                                          onClick={(e) => handleReplyClick(e)}
                                          id={message.id}
                                        >
                                          <Reply
                                            className="h-7 w-7"
                                            strokeWidth={1.5}
                                            color="#ffffff"
                                          />
                                        </button>
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>
                            );
                          });
                        })()}
                    </div>
                    <div className="input-container w-full px-8 relative">
                      <div
                        className={`reply-div absolute top-[-80px] left-0 right-0 border border-border border-x-0 px-12 py-3 bg-background border-b-0 z-[5] ${
                          openReply.open ? "block" : "hidden"
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          Replying to{" "}
                          {openReply.sender_id === userInfo._id
                            ? "yourself"
                            : participant.username}
                          <button className="p-1" onClick={handleCloseReply}>
                            <X
                              className="h-[20px] w-[20px]"
                              strokeWidth={2}
                              color="#dadada"
                            />
                          </button>
                        </div>
                        <p className="text-[#989898] text-[12px] mt-1 overflow-hidden text-ellipsis whitespace-nowrap max-w-[1300px]">
                          {openReply.content}
                        </p>
                      </div>

                      <input
                        type="text"
                        className="w-full pl-6 pr-14 py-4 outline-none border border-border bg-background rounded-xl"
                        placeholder="Message..."
                        ref={messageInputRef}
                        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                      />
                      <button
                        className="p-2 absolute right-12 top-1/2 transform -translate-y-1/2"
                        onClick={sendMessage}
                      >
                        <Send
                          className="h-[20px] w-[20px]"
                          strokeWidth={2}
                          color="#dadada"
                        />
                      </button>
                    </div>
                  </>
                )}
              </div>
              <Sidebar
                isFloating={false}
                isOpen={isSidebarOpen}
                onClose={toggleSidebar}
              >
                <div className="h-full bg-background flex flex-col items-center justify-center">
                  <p className="text-xs text-[#989898] font-medium">
                    Messages can't be recovered if both users delete the chat
                  </p>

                  <Dialog.Root>
                    <Dialog.Trigger asChild>
                      <button className="py-[6px] px-4 bg-[#e31010] rounded-full font-semibold hover:bg-[#c71010] transition-colors mb-8 mt-3">
                        Delete chat
                      </button>
                    </Dialog.Trigger>
                    <Dialog.Portal>
                      <Dialog.Overlay className="bg-blackA6 data-[state=open]:animate-overlayShow fixed inset-0 z-[100]" />
                      <Dialog.Content className="data-[state=open]:animate-contentShow fixed top-[50%] left-[50%] max-h-[85vh] w-[90vw] max-w-[450px] translate-x-[-50%] translate-y-[-50%] rounded-xl bg-background border border-border p-8 shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] focus:outline-none z-[110]">
                        <div className="flex justify-between items-center">
                          <Dialog.Title className="inline-block text-[16px] font-semibold">
                            Delete chat with {participant.username}?
                          </Dialog.Title>
                          <Dialog.Close asChild>
                            <button
                              className="rounded-full p-1 flex items-center justify-center"
                              aria-label="Close"
                            >
                              <X
                                className="h-[20px] w-[20px]"
                                strokeWidth={2}
                                color="#ffffff"
                              />
                            </button>
                          </Dialog.Close>
                        </div>
                        <div className="my-10">
                          Messages can't be recovered if both users delete the
                          chat
                        </div>
                        <div className="flex justify-end">
                          <Dialog.Close asChild>
                            <button
                              className={`block ${
                                loader
                                  ? "w-[61.2px] h-[33px] flex items-center justify-center cursor-not-allowed"
                                  : "py-[6px] px-4 hover:bg-[#c71010]"
                              } bg-[#e31010] transition-colors rounded-full font-semibold relative`}
                              onClick={handleDeleteChat}
                            >
                              Delete
                            </button>
                          </Dialog.Close>
                        </div>
                      </Dialog.Content>
                    </Dialog.Portal>
                  </Dialog.Root>
                </div>
              </Sidebar>
            </div>
          ) : (
            <div className="bg-background h-full w-full flex items-center justify-center text-[#989898]">
              Search for an account to start a chat
            </div>
          )}
        </div>
        <Toaster
          toastOptions={{
            success: {
              iconTheme: {
                primary: "#11AB00",
                secondary: "#ffffff",
              },
            },
            error: {
              iconTheme: {
                primary: "#e60f00",
                secondary: "#ffffff",
              },
            },
          }}
        />
      </div>
    </>
  );
}
