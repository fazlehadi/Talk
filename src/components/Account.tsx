import {
  useContext,
  useEffect,
  useRef,
  useState,
  ChangeEvent,
} from "react";
import { Pencil, User, X } from "lucide-react";
import { Context } from "../context/Context.tsx";
import * as Dialog from "@radix-ui/react-dialog";
import * as Separator from "@radix-ui/react-separator";
import toast, { Toaster } from "react-hot-toast";

interface UserInfo {
  profile_image?: string | null;
  username?: string;
  email?: string;
  description?: string;
}

interface UpdateUserInfoData {
  username?: string;
  email?: string;
  description?: string;
  profile_image?: string;
  old_password?: string;
  new_password?: string;
}

interface ContextType {
  userInfo: UserInfo;
  updateUserInfo: (data: UpdateUserInfoData) => Promise<number>;
  loader: boolean;
  uploadImage: (file: File) => Promise<string>;
}

export default function Account() {
  const { userInfo, updateUserInfo, loader, uploadImage } = useContext(
    Context
  ) as ContextType;

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  let imageURL: string | undefined;
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    userInfo.profile_image || null
  );
  const [username, setUsername] = useState<string>(userInfo.username || "");
  const [email, setEmail] = useState<string>(userInfo.email || "");
  const [description, setDescription] = useState<string>(
    userInfo.description || ""
  );
  const [oldPassword, setOldPassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");

  const handleUpdateUsername = (e: ChangeEvent<HTMLInputElement>): void => {
    setUsername(e.target.value);
  };

  const handleUpdateEmail = (e: ChangeEvent<HTMLInputElement>): void => {
    setEmail(e.target.value);
  };

  const handleUpdateDesc = (e: ChangeEvent<HTMLTextAreaElement>): void => {
    setDescription(e.target.value);
  };

  async function handleUserInfoUpdate(): Promise<void> {
    const isUsernameChanged = username !== userInfo.username;
    const isEmailChanged = email !== userInfo.email;
    const isDescriptionChanged = description !== userInfo.description;
    const isImageFileChanged = !!imageFile;

    if (username.length < 3 || username.length > 30) {
      toast.error("Username can be 3-30 chars long");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      toast.error("Invalid email");
      return;
    }

    if (description.length > 60) {
      toast.error("Description must be 60 characters or less");
      return;
    }

    if (isImageFileChanged && imageFile) {
      try {
        imageURL = await uploadImage(imageFile);
      } catch (error) {
        toast.error("Error uploading image");
        return;
      }
    }

    if (
      isUsernameChanged ||
      isEmailChanged ||
      isDescriptionChanged ||
      isImageFileChanged
    ) {
      const updateData: UpdateUserInfoData = {
        username: isUsernameChanged ? username : undefined,
        email: isEmailChanged ? email : undefined,
        description: isDescriptionChanged ? description : undefined,
        profile_image: isImageFileChanged ? imageURL : undefined,
      };

      const status = await updateUserInfo(updateData);

      if (status === 200) {
        toast.success("Account updated successfully!");
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        toast.error("Error updating account. Please try again.");
      }
    } else {
      toast.error("No valid changes detected.");
    }
  }

  const handlePasswordUpdate = async (): Promise<void> => {
    if (
      newPassword === confirmPassword &&
      newPassword.length >= 8 &&
      newPassword.length <= 16
    ) {
      const status = await updateUserInfo({
        old_password: oldPassword,
        new_password: newPassword,
      });

      if (status === 200) {
        toast.success("Password updated successfully!");
      } else {
        toast.error("Error updating password");
      }
    } else {
      toast.error("Passwords don't match or are invalid");
    }
  };

  const handleOldPasswordChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setOldPassword(e.target.value);
  };

  const handleNewPasswordChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setNewPassword(e.target.value);
  };

  const handleConfirmPasswordChange = (
    e: ChangeEvent<HTMLInputElement>
  ): void => {
    setConfirmPassword(e.target.value);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleButtonClick = (): void => {
    fileInputRef.current?.click();
  };

  const logout = (): void => {
    localStorage.removeItem("auth-token");
    window.location.assign("/");
  };

  useEffect(() => {
    if (userInfo) {
      setUsername(userInfo.username || "");
      setEmail(userInfo.email || "");
      setDescription(userInfo.description || "");
      setImagePreview(userInfo.profile_image || null);
    }
  }, [userInfo]);

  return (
    <>
      <div className="bg-div-signup flex items-center justify-center h-screen">
        <div className="border border-border w-[400px] h-[700px] rounded-xl flex flex-col items-center">
          <p className="text-[20px] font-semibold my-14">Account</p>
          {imagePreview ? (
            <div
              className="image-container rounded-full h-32 w-32 overflow-hidden border border-border relative group cursor-pointer"
              onClick={handleButtonClick}
            >
              <img
                src={imagePreview}
                className="h-full w-full object-cover rounded-full"
              />
              <div className="absolute inset-0 bg-black/70 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Pencil className="h-12 w-12" strokeWidth={2} color="#ffffff" />
              </div>
            </div>
          ) : (
            <button
              className="p-8 rounded-full relative overflow-hidden group border border-border"
              onClick={handleButtonClick}
            >
              <User className="h-16 w-16" strokeWidth={2} color="#ffffff" />
              <div className="absolute inset-0 bg-black/70 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Pencil className="h-12 w-12" strokeWidth={2} color="#ffffff" />
              </div>
            </button>
          )}

          <input
            type="file"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handleFileChange}
            accept="image/*"
          />

          <div className="mt-5 flex flex-col items-center">
            <input
              type="text"
              name="username"
              value={username}
              onChange={handleUpdateUsername}
              placeholder="Username"
              className="outline-none border-border border rounded-xl bg-background py-2 px-4 focus:ring-[2px] focus:ring-[#636363] focus:border-transparent transition"
            />

            <input
              type="email"
              name="email"
              value={email}
              onChange={handleUpdateEmail}
              placeholder="Email"
              className="outline-none border-border border rounded-xl bg-background py-2 px-4 focus:ring-[2px] focus:ring-[#636363] focus:border-transparent transition mt-4"
            />

            <textarea
              name="description"
              value={description}
              onChange={handleUpdateDesc}
              rows={4}
              maxLength={60}
              placeholder="Description"
              className="outline-none border-border border rounded-xl bg-background py-2 px-4 focus:ring-[2px] focus:ring-[#636363] focus:border-transparent transition resize-none mt-4 w-full"
            />
          </div>

          <button
            className={`block ${
              loader
                ? "w-[61.2px] h-[33px] flex items-center justify-center cursor-not-allowed"
                : "py-[6px] px-4 hover:bg-primaryDark"
            } bg-primary transition-colors rounded-full font-semibold mt-7 relative`}
            disabled={loader}
            onClick={handleUserInfoUpdate}
          >
            {loader ? <div className="loader"></div> : "Save"}
          </button>

          <Dialog.Root>
            <Dialog.Trigger asChild>
              <button className="py-[6px] px-4 border border-[#636363] bg-background rounded-full font-semibold hover:bg-[#242424] transition-colors mt-8">
                Change your password
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="bg-blackA6 data-[state=open]:animate-overlayShow fixed inset-0 z-[100]" />
              <Dialog.Content className="data-[state=open]:animate-contentShow fixed top-[50%] left-[50%] max-h-[85vh] w-[90vw] max-w-[450px] translate-x-[-50%] translate-y-[-50%] rounded-xl bg-background border border-border p-8 shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] focus:outline-none z-[110]">
                <div className="flex justify-between items-center">
                  <Dialog.Title className="inline-block text-[16px] font-semibold">
                    Change your password
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
                <div className="flex flex-col mt-14 mb-10 space-y-4 px-5">
                  <input
                    type="password"
                    name="old_password"
                    onChange={handleOldPasswordChange}
                    required
                    placeholder="Old Password"
                    className="outline-none border-border border rounded-xl bg-background py-2 px-4 focus:ring-[2px] focus:ring-[#636363] focus:border-transparent transition"
                  />

                  <input
                    type="password"
                    name="new_password"
                    onChange={handleNewPasswordChange}
                    required
                    placeholder="New Password"
                    className="outline-none border-border border rounded-xl bg-background py-2 px-4 focus:ring-[2px] focus:ring-[#636363] focus:border-transparent transition"
                  />

                  <input
                    type="password"
                    name="confirm_password"
                    onChange={handleConfirmPasswordChange}
                    required
                    placeholder="Confirm Password"
                    className="outline-none border-border border rounded-xl bg-background py-2 px-4 focus:ring-[2px] focus:ring-[#636363] focus:border-transparent transition"
                  />
                </div>
                <div className="flex justify-end">
                  <Dialog.Close asChild>
                    <button
                      className={`block ${
                        loader
                          ? "w-[61.2px] h-[33px] flex items-center justify-center cursor-not-allowed"
                          : "py-[6px] px-4 hover:bg-primaryDark"
                      } bg-primary transition-colors rounded-full font-semibold mt-7 relative`}
                      disabled={loader}
                      onClick={handlePasswordUpdate}
                    >
                      {loader ? <div className="loader"></div> : "Save"}
                    </button>
                  </Dialog.Close>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>

          <Separator.Root className="bg-border data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-80 my-8" />

          <button
            className="py-[6px] px-4 bg-[#e31010] rounded-full font-semibold hover:bg-[#c71010] transition-colors"
            onClick={logout}
          >
            Logout
          </button>
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
