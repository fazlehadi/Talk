import { useContext, useEffect } from "react";
import logo from "../../public/logo.svg";
import { Link } from "react-router-dom";
import { Context } from "../context/Context.tsx";
import { User } from "lucide-react";

// Define the shape of userInfo
interface UserInfo {
  profile_image: string | null;
}

// Define the shape of context values
interface ContextType {
  fetchUserInfo: () => Promise<void>;
  userInfo: UserInfo;
}

export default function Navbar() {
  const { fetchUserInfo, userInfo } = useContext(Context) as ContextType;

  function toHome() {
    window.location.assign("/");
  }

  useEffect(() => {
    async function runFetchFunc() {
      await fetchUserInfo();
    }

    runFetchFunc();
  }, [fetchUserInfo]);

  return (
    <>
      <div className="navbar w-full border border-b-border border-t-0 border-x-0 flex items-center justify-between px-6 py-2 backdrop-blur-xl bg-background/30 fixed z-50">
        <img
          src={logo}
          alt="logo"
          width={70}
          onClick={toHome}
          className="cursor-pointer"
        />
        {localStorage.getItem("auth-token") ? (
          <>
            <div className="account">
              <Link to="/account" tabindex="-1">
                {userInfo.profile_image ? (
                  <div className="rounded-full h-10 w-10 overflow-hidden cursor-pointer border border-border">
                    <img
                      src={userInfo.profile_image}
                      className="h-full w-full object-cover rounded-full"
                    />
                  </div>
                ) : (
                  <button className="p-1 rounded-full border border-border">
                    <User className="h-6 w-6" strokeWidth={2} color="#ffffff" />
                  </button>
                )}
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="buttons">
              <Link to="/signup" tabindex="-1">
                <button className="py-[6px] px-4 bg-primary rounded-full font-semibold mr-2 hover:bg-primaryDark transition-colors">
                  Signup
                </button>
              </Link>
              <Link to="/login" tabindex="-1">
                <button className="py-[6px] px-4 border border-[#636363] bg-background rounded-full font-semibold hover:bg-[#242424] transition-colors">
                  Login
                </button>
              </Link>
            </div>
          </>
        )}
      </div>
    </>
  );
}
