import { X } from "lucide-react";
import React from "react";

const Sidebar = ({ isFloating, isOpen, onClose, children }) => {
  return (
    <>
      {isFloating ? (
        <>
          {/* Overlay with fade-in/out effect */}
          <div
            className={`fixed inset-0 bg-black transition-opacity duration-200 ease-out z-[50] ${
              isOpen ? "opacity-20" : "opacity-0 pointer-events-none"
            }`}
            onClick={onClose}
          ></div>

          {/* Sidebar Content */}
          <div
            className={`fixed top-0 right-0 h-full w-96 bg-background p-4 pt-24 shadow-lg z-[60] transition-transform duration-200 ease-out ${
              isOpen ? "translate-x-0" : "translate-x-full"
            }`}
          >
            {/* Close button */}
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 p-1"
              onClick={onClose}
            >
              <X
                className="h-[20px] w-[20px]"
                strokeWidth={2}
                color="#dadada"
              />
            </button>

            {/* Sidebar Content */}
            {children}
          </div>
        </>
      ) : (
        <>
          {/* Sidebar Content */}
          <div
            className={`fixed top-1/6 right-0 w-96 bg-background transition-transform duration-100 z-[60] ease-out border border-l-border border-t-0 border-b-0 border-r-0 ${
              isOpen ? "translate-x-0" : "translate-x-full"
            }`}
            style={{ height: "calc(100vh - 110px" }}
          >
            {/* Sidebar Content */}
            {children}
          </div>
        </>
      )}
    </>
  );
};

export default Sidebar;

{
  /*
  example to use this component and also remove these styles form the div you want ot to slide if isFlaoting is set to true {className={`flex-1 transition-margin duration-200 ease-out ${isSidebarOpen ? "mr-96" : "mr-0" }`}}

  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  <button
    onClick={toggleSidebar}
    className="p-2"
  >
    meow
  </button>
  <Sidebar isFloating={true} isOpen={isSidebarOpen} onClose={toggleSidebar}>
    <h2 className="text-xl font-bold">Sidebar Content</h2>
    <p>
      Put your sidebar content here, such as links or
      information.
    </p>
  </Sidebar>
*/
}
