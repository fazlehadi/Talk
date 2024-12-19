import React, { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { X } from "lucide-react";

const DialogInDropdown = ({
  triggerType = "dropdown",
  triggerProps,
  title,
  description,
  onConfirm,
  children,
  onClickFunction,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  const openDialog = () => setDialogOpen(true);
  const closeDialog = () => setDialogOpen(false);

  useEffect(() => {
    if (dialogOpen) {
      const scrollBarWidth =
        window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = `${scrollBarWidth}px`;
    } else {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    }

    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [dialogOpen]);

  return (
    <>
      <Dialog.Root>
        <DropdownMenu.Root modal={false}>
          <DropdownMenu.Trigger className="outline-none">
            <button className="p-2 outline-none">open</button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content
            side="bottom"
            align="end"
            className="bg-background p-1 rounded-xl border border-border z-50"
          >
            <Dialog.Trigger asChild>
              Delete chat
              <DropdownMenu.Item
                className="py-1 px-4 font-medium hover:outline-none text-[#ff1010] hover:bg-border hover:text-white rounded-lg cursor-default"
                onClick={onClickFunction}
              >
                delete chat
              </DropdownMenu.Item>
            </Dialog.Trigger>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
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
            <div className="flex flex-col mt-14 mb-10 space-y-4 px-5">meow</div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
};

export default DialogInDropdown;
