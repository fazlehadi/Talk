import React, { createContext, useState } from "react";

export const Context = createContext();

export const ContextProvider = ({ children }) => {
  const [loader, setLoader] = useState(false);
  const [userInfo, setUserInfo] = useState({});
  const [participantsInfo, setParticipantsInfo] = useState([]);
  const [messages, setMessages] = useState({});
  const [selectedChat, setSelectedChat] = useState({});

  async function signup(data) {
    if (!data) {
      return;
    }

    const body = {
      username: data.username,
      email: data.email,
      password: data.password,
    };

    setLoader(true);

    try {
      const response = await fetch(`http://localhost:8000/api/user/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      setLoader(false);
      return response.status;
    } catch (error) {
      setLoader(false);
      console.error(error);
    }
  }

  async function login(data) {
    if (!data) {
      return;
    }

    const body = {
      username: data.username,
      password: data.password,
    };

    setLoader(true);

    try {
      const response = await fetch(`http://localhost:8000/api/user/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // "auth-token": localStorage.getItem("auth-token"),
        },
        body: JSON.stringify(body),
      });

      setLoader(false);

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("auth-token", data.access_token);
      }

      return response.status;
    } catch (error) {
      setLoader(false);
      console.error(error);
    }
  }

  async function updateUserInfo(data) {
    const {
      username,
      email,
      description,
      profile_image,
      old_password,
      new_password,
    } = data;

    // Check if at least one of the non-password fields is provided
    const hasNonPasswordFields =
      username || email || description || profile_image;

    // If passwords are provided, both old and new must be provided
    const hasPasswordFields = old_password && new_password;

    // If no valid fields are provided, return early
    if (!hasNonPasswordFields && !hasPasswordFields) {
      return;
    }

    // If only one of the passwords is provided, return early
    if ((old_password && !new_password) || (!old_password && new_password)) {
      return;
    }

    const body = {
      username,
      email,
      description,
      profile_image,
      old_password,
      new_password,
    };

    // Remove undefined fields from the body
    Object.keys(body).forEach((key) => {
      if (!body[key]) delete body[key];
    });

    setLoader(true);

    try {
      const response = await fetch(
        `http://localhost:8000/api/user/update-user`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("auth-token")}`,
          },
          body: JSON.stringify(body),
        }
      );

      setLoader(false);

      return response.status;
    } catch (error) {
      setLoader(false);
      console.error(error);
    }
  }

  async function uploadImage(file) {
    // Ensure a file is provided
    if (!file) {
      return;
    }

    setLoader(true);

    // Create a FormData object to send the file
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(
        `http://localhost:8000/api/upload/upload-image`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth-token")}`,
          },
          body: formData,
        }
      );

      setLoader(false);

      const data = await response.json();

      return data.url;
    } catch (error) {
      setLoader(false);
      console.error(error);
    }
  }

  async function fetchUserInfo(participantID) {
    try {
      const response = await fetch(
        `http://localhost:8000/api/user/fetch-user${
          participantID ? "?profile_id=" + participantID : ""
        }`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("auth-token")}`,
          },
        }
      );

      const data = await response.json();

      if (participantID) {
        return data;
      } else {
        setUserInfo(data);

        const fetchPromises = data.inbox.chats.map((chat) => {
          return fetchUserInfo(chat.participant_id);
        });

        setParticipantsInfo(await Promise.all(fetchPromises));
      }
    } catch (error) {
      console.error(error);
    }
  }

  async function searchUsers(username) {
    if (!username) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:8000/api/search/search-users?username=${username}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("auth-token")}`,
          },
        }
      );

      const data = await response.json();
      return data.results;
    } catch (error) {
      setLoader(false);
      console.error(error);
    }
  }

  async function createChat(participantID) {
    if (!participantID) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:8000/api/chat/create-chat/${participantID}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("auth-token")}`,
          },
        }
      );

      const data = await response.json();
      return data;
    } catch (error) {
      setLoader(false);
      console.error(error);
    }
  }

  async function fetchRecentChat(chat_id) {
    if (!chat_id) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:8000/api/chat/fetch-recent-chat/${chat_id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("auth-token")}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMessages((prevChats) => ({
          ...prevChats,
          [chat_id]: {
            recent: data.messages, // Save the recent messages in the "recent" bucket
          },
        }));
      } else {
        setMessages((prevChats) => ({
          ...prevChats,
          [chat_id]: {
            recent: [],
          },
        }));
      }

      // Only call fetchOlderChat if recent messages have been fetched and are less than 15
      if (data.messages.length < 15) {
        await fetchOlderChat(chat_id);
      }
    } catch (error) {
      setLoader(false);
      console.error(error);
    }
  }

  async function fetchOlderChat(chatID, messageBucketSequence = 0) {
    if (!chatID) {
      return;
    }
    setLoader(true);

    try {
      const response = await fetch(
        `http://localhost:8000/api/chat/fetch-older-chat/${chatID}/${messageBucketSequence}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("auth-token")}`,
          },
        }
      );

      const data = await response.json();
      setLoader(false);

      if (response.ok) {
        setMessages((prevChats) => ({
          ...prevChats,
          [chatID]: {
            ...prevChats[chatID],
            [messageBucketSequence]: data.bucket.messages,
          },
        }));
      }
    } catch (error) {
      setLoader(false);
      console.error(error);
    }
  }

  async function deleteChat(chatID) {
    if (!chatID) {
      return;
    }

    setLoader(true);
    try {
      const response = await fetch(
        `http://localhost:8000/api/chat/delete-chat/${chatID}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("auth-token")}`,
          },
        }
      );

      setLoader(false);
      return response;
    } catch (error) {
      setLoader(false);
      console.error(error);
    }
  }

  async function markAsSeen(chatID, seen_timestamp) {
    if (!chatID || !seen_timestamp) {
      return;
    }

    setLoader(true);
    try {
      const response = await fetch(
        `http://localhost:8000/api/chat/mark-as-seen/${chatID}/${seen_timestamp}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("auth-token")}`,
          },
        }
      );

      setLoader(false);
      return response;
    } catch (error) {
      setLoader(false);
      console.error(error);
    }
  }

  return (
    <Context.Provider
      value={{
        uploadImage,
        loader,
        signup,
        login,
        setLoader,
        fetchUserInfo,
        userInfo,
        setUserInfo,
        updateUserInfo,
        searchUsers,
        createChat,
        fetchRecentChat,
        fetchOlderChat,
        deleteChat,
        markAsSeen,
        participantsInfo,
        messages,
        setMessages,
        selectedChat,
        setSelectedChat,
      }}
    >
      {children}
    </Context.Provider>
  );
};
