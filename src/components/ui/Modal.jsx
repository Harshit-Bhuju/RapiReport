import React, { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  hideHeader = false,
}) => {
  const sizes = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    xxl: "max-w-6xl",
    // Full-screen style: take entire viewport
    full: "max-w-full h-[100dvh] sm:max-w-full md:max-w-5xl md:h-[90vh]",
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div
            className={cn(
              "flex min-h-full items-center justify-center",
              size === "full" ? "p-0 sm:p-2" : "p-4",
            )}>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95">
              <Dialog.Panel
                className={cn(
                  "w-full transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all",
                  hideHeader ? "p-0" : "p-6",
                  sizes[size],
                )}>
                {/* Header */}
                {!hideHeader && (
                  <div className="flex items-center justify-between mb-4">
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-bold text-gray-900 leading-6">
                      {title}
                    </Dialog.Title>
                    <button
                      onClick={onClose}
                      className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500 transition-all outline-none focus:ring-2 focus:ring-primary-500">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                )}
                {children}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default Modal;
