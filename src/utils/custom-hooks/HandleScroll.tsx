import { useRef, useEffect, useContext } from "react";
import { Context } from "../../context/Context";

function useChatScrollHandler(scrollableDivRef) {
  const { selectedChat, messages, fetchOlderChat } = useContext(Context);

  const scrollPositionRef = useRef(0); // holds previous scroll position
  let isFetchingOlderMessages = false; // using variable instead of state

  useEffect(() => {
    const scrollableDiv = scrollableDivRef.current;
    if (!scrollableDiv) return;

    const handleScroll = () => {
      if (scrollableDiv.scrollTop === 0 && !isFetchingOlderMessages) {
        // Save the scroll height before fetching
        scrollPositionRef.current = scrollableDiv.scrollHeight;

        // Set fetching state to prevent multiple fetches
        isFetchingOlderMessages = true;

        // Check if older messages need to be fetched
        if (!messages[selectedChat.chat_id]?.hasOwnProperty("0")) {
          fetchOlderChat(
            selectedChat.chat_id,
            Object.keys(messages[selectedChat.chat_id]).length - 1
          ).then(() => {
            // Restore the scroll position after fetching
            setTimeout(() => {
              const newScrollHeight = scrollableDiv.scrollHeight;
              scrollableDiv.scrollTop =
                newScrollHeight - scrollPositionRef.current;

              // Reset fetching state
              isFetchingOlderMessages = false;
            }, 0);
          });
        } else {
          isFetchingOlderMessages = false;
        }
      }
    };

    // Scroll to bottom when new messages arrive, if not fetching older messages
    if (!isFetchingOlderMessages) {
      scrollableDiv.scrollTo({ top: scrollableDiv.scrollHeight });
    }

    // Add scroll event listener
    scrollableDiv.addEventListener("scroll", handleScroll);

    // Clean up event listener on unmount
    return () => {
      scrollableDiv.removeEventListener("scroll", handleScroll);
    };
  }, [selectedChat, messages, fetchOlderChat]);
}

export default useChatScrollHandler;
