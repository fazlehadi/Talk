import { ChangeEvent, MouseEvent, useContext, useState } from "react";
import logo from "../../public/favicon.svg";
import { Link } from "react-router-dom/cjs/react-router-dom";
import { Context } from "../context/Context.tsx";
import toast, { Toaster } from "react-hot-toast";

// Type definition for input values
interface InputValues {
  username: string;
  password: string;
}

interface ContextType {
  loader: boolean;
  login: (inputValues: InputValues) => Promise<number>; // Assuming login returns a status code
}

export default function Login() {
  const [inputValues, setInputValues] = useState<InputValues>({
    username: "",
    password: "",
  });

  const { loader, login } = useContext(Context) as ContextType;

  // Change handler for form input fields
  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInputValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleClick = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (inputValues.username.length < 3 || inputValues.username.length > 30) {
      toast.error("Username can be 3-30 chars long", {
        duration: 2500,
        position: "top-center",
        style: {
          background: "#151515",
          border: "1px solid #2c2c2c",
          color: "#ffffff",
        },
      });
    } else if (
      inputValues.password.length < 8 ||
      inputValues.password.length > 16
    ) {
      toast.error("Password can be 8-16 chars long", {
        duration: 2500,
        position: "top-center",
        style: {
          background: "#151515",
          border: "1px solid #2c2c2c",
          color: "#ffffff",
        },
      });
    } else if (!inputValues.username && !inputValues.password) {
      toast.error("Please fill all the required fields", {
        duration: 2500,
        position: "top-center",
        style: {
          background: "#151515",
          border: "1px solid #2c2c2c",
          color: "#ffffff",
        },
      });
    } else {
      const status = await login(inputValues);
      if (status === 200) {
        toast.success("Logged in successfully", {
          duration: 2500,
          position: "top-center",
          style: {
            background: "#151515",
            border: "1px solid #2c2c2c",
            color: "#ffffff",
          },
        });

        setTimeout(() => {
          window.location.assign("/inbox");
        }, 1000);
      } else if (status === 400) {
        toast.error("Invalid username or password", {
          duration: 2500,
          position: "top-center",
          style: {
            background: "#151515",
            border: "1px solid #2c2c2c",
            color: "#ffffff",
          },
        });
      }
    }
  };

  return (
    <>
      <div className="bg-div-signup flex items-center justify-center h-screen">
        <div className="border border-border w-[400px] h-[500px] rounded-xl">
          {/* <div className="relative"> */}
          <img
            src={logo}
            alt="logo"
            width={50}
            className="mx-auto mt-24 mb-16"
          />
          {/* <div className="h-12 w-12 bg-primary absolute top-[4px] translate-x-[178px] -z-10 shadow-[0_0_20px_rgba(0,115,255,0.7)] blur-xl"></div> */}
          {/* </div> */}

          <input
            className="rounded-xl border border-border bg-background py-2 px-4 outline-none mt-4 mx-auto block w-[330px] focus:ring-[2px] focus:ring-[#636363] focus:border-transparent transition duration-200"
            type="text"
            placeholder="Username"
            name="username"
            onChange={onChange}
            required
          />
          <input
            className="rounded-xl border border-border bg-background py-2 px-4 outline-none mt-6 mx-auto block w-[330px] focus:ring-[2px] focus:ring-[#636363] focus:border-transparent transition duration-200"
            placeholder="Password"
            type="password"
            name="password"
            onChange={onChange}
            required
          />

          <button
            className={`block ${
              loader
                ? "w-[65.44px] h-[33px] flex items-center justify-center cursor-not-allowed"
                : "py-[6px] px-4 hover:bg-primaryDark"
            } bg-primary transition-colors rounded-full font-semibold mx-auto mt-8 relative`}
            disabled={loader}
            onClick={handleClick}
          >
            {loader ? <div className="loader"></div> : "Login"}
          </button>

          <p className="text-sm mt-8 text-[#989898] text-center">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="text-blue-300 underline underline-offset-4"
            >
              Create an account
            </Link>
          </p>
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
      </div>
    </>
  );
}
