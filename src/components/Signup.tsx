import React, { useContext, useState } from "react";
import logo from "../../public/favicon.svg";
import { Link, useHistory } from "react-router-dom";
import { Context } from "../context/Context.tsx";
import toast, { Toaster } from "react-hot-toast";

// Define types for the input values
interface InputValues {
  username: string;
  email: string;
  password: string;
  cpassword: string;
}

interface ContextType {
  loader: boolean;
  signup: (inputValues: InputValues) => Promise<number>; // Assuming login returns a status code
}

export default function Signup() {
  // Define state with proper types
  const [inputValues, setInputValues] = useState<InputValues>({
    username: "",
    email: "",
    password: "",
    cpassword: "",
  });

  // Destructure from context with appropriate types
  const { loader, signup } = useContext(Context) as ContextType;

  // Use history from react-router-dom
  const history = useHistory();

  // Define the onChange handler with the correct event type
  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInputValues((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }

  async function handleClick() {
    if (inputValues.password !== inputValues.cpassword) {
      toast.error("Passwords do not match", {
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
    } else if (
      inputValues.username.length < 3 ||
      inputValues.username.length > 30
    ) {
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
      !inputValues.username &&
      !inputValues.email &&
      !inputValues.password
    ) {
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
      const status = await signup(inputValues);
      if (status === 201) {
        toast.success("Account created successfully", {
          duration: 2500,
          position: "top-center",
          style: {
            background: "#151515",
            border: "1px solid #2c2c2c",
            color: "#ffffff",
          },
        });

        setTimeout(() => {
          history.push("/login");
        }, 1000);
      } else if (status === 400) {
        toast.error("Account with that username already exists", {
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
  }

  return (
    <>
      <div className="bg-div-signup flex items-center justify-center h-screen">
        <div className="border border-border w-[400px] h-[600px] rounded-xl">
          <img
            src={logo}
            alt="logo"
            width={50}
            className="mx-auto mt-32 mb-16"
          />

          <input
            className="rounded-xl border border-border bg-background py-2 px-4 outline-none mx-auto block w-[330px] focus:ring-[2px] focus:ring-[#636363] focus:border-transparent transition duration-200"
            placeholder="Username"
            type="text"
            required
            name="username"
            onChange={onChange}
          />
          <input
            className="rounded-xl border border-border bg-background py-2 px-4 outline-none mt-4 mx-auto block w-[330px] focus:ring-[2px] focus:ring-[#636363] focus:border-transparent transition duration-200"
            placeholder="Email"
            type="email"
            required
            name="email"
            onChange={onChange}
          />
          <input
            className="rounded-xl border border-border bg-background py-2 px-4 outline-none mt-4 mx-auto block w-[330px] focus:ring-[2px] focus:ring-[#636363] focus:border-transparent transition duration-200"
            placeholder="Password"
            type="password"
            required
            name="password"
            onChange={onChange}
          />
          <input
            className="rounded-xl border border-border bg-background py-2 px-4 outline-none mt-4 mx-auto block w-[330px] focus:ring-[2px] focus:ring-[#636363] focus:border-transparent transition duration-200"
            placeholder="Confirm Password"
            type="password"
            required
            name="cpassword"
            onChange={onChange}
          />
          <button
            className={`block ${
              loader
                ? "w-[75.4px] h-[33px] flex items-center justify-center cursor-not-allowed"
                : "py-[6px] px-4 hover:bg-primaryDark"
            } bg-primary transition-colors rounded-full font-semibold mx-auto mt-10 relative`}
            onClick={handleClick}
            disabled={loader}
          >
            {loader ? <div className="loader"></div> : "Signup"}
          </button>

          <p className="text-sm mt-5 text-[#989898] text-center">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-blue-300 underline underline-offset-4"
            >
              Login
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
