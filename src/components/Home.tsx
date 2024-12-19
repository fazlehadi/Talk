import landingPageImage from "../../public/landing-page-image.png";
import logo from "../../public/logo.svg";
import { Mail, Phone } from "lucide-react";
import { Link } from "react-router-dom";

export default function Home() {
  // Check if the user is authenticated by looking for "auth-token" in localStorage
  const isAuthenticated = localStorage.getItem("auth-token") !== null;

  if (isAuthenticated) {
    // Redirect to inbox if the user is authenticated
    window.location.assign("/inbox");
  }

  return (
    <>
      <div className="px-56 flex justify-between py-64 bg-div-home">
        <div className="text mt-14">
          <p className="text-6xl font-semibold w-[420px] leading-[75px]">
            The chat app for everyone
          </p>
          <p className="text-[#dadada] mt-6 ml-2">
            Free, Fast and Secure! Signup today to start socializing better
          </p>
          <Link to="/signup" tabindex="-1">
            <button className="py-[6px] px-4 bg-primary hover:bg-primaryDark transition-colors rounded-full font-semibold mt-12">
              Get started
            </button>
          </Link>
        </div>
        <div className="image">
          <img src={landingPageImage} alt="image" width={1000} />
        </div>
      </div>
      <footer className="border border-t-border border-x-0 border-b-0 h-80 w-full flex justify-between px-60 pt-24">
        <div>
          <img src={logo} alt="logo" width={70} />
        </div>
        <div className="contact">
          <p className="font-medium text-[#dadada] mb-3">Contact</p>
          <div className="flex items-center mb-2">
            <Phone size={16} color="#dadada" className="mr-2" />
            <p className="text-[#dadada] ">+92 301 703 4290</p>
          </div>
          <div className="flex items-center">
            <Mail size={16} color="#dadada" className="mr-2" />
            <p className="text-[#dadada] ">contact@talk.com</p>
          </div>
        </div>
      </footer>
    </>
  );
}
