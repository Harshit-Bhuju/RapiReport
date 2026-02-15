import React, { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { AlertTriangle, Trash2, Info } from "lucide-react";
import { useConfirmStore } from "@/store/confirmStore";
import { cn } from "@/lib/utils";

const variantStyles = {
  danger: {
    icon: Trash2,
    iconBg: "bg-error-50",
    iconColor: "text-error-700",
    button: "bg-error-500 hover:bg-error-700 text-white",
  },
  warning: {
    icon: AlertTriangle,
    iconBg: "bg-warning-50",
    iconColor: "text-warning-700",
    button: "bg-warning-500 hover:bg-warning-700 text-white",
  },
  primary: {
    icon: Info,
    iconBg: "bg-primary-100",
    iconColor: "text-primary-600",
    button: "bg-primary-600 hover:bg-primary-700 text-white",
  },
};

export default function ConfirmModal() {
  const {
    isOpen,
    closeConfirm,
    title,
    message,
    confirmLabel,
    cancelLabel,
    variant,
    isLoading,
    onConfirm,
    onCancel,
  } = useConfirmStore();

  const style = variantStyles[variant] || variantStyles.danger;
  const Icon = style.icon;

  const handleCancel = () => {
    typeof onCancel === "function" && onCancel();
    closeConfirm();
  };

  const handleConfirm = async () => {
    try {
      useConfirmStore.getState().setConfirmLoading(true);
      if (typeof onConfirm === "function") {
        await Promise.resolve(onConfirm());
      }
      closeConfirm();
    } catch (err) {
      console.error("Confirm action error:", err);
      useConfirmStore.getState().setConfirmLoading(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[100]" onClose={handleCancel}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto flex items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95">
            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all p-6">
              <div className="flex gap-4">
                <div
                  className={cn(
                    "flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center",
                    style.iconBg,
                    style.iconColor
                  )}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-bold text-gray-900 leading-6">
                    {title}
                  </Dialog.Title>
                  <p className="mt-2 text-sm text-gray-600">{message}</p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={isLoading}
                      className="px-4 py-2.5 rounded-xl font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50">
                      {cancelLabel}
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirm}
                      disabled={isLoading}
                      className={cn(
                        "px-4 py-2.5 rounded-xl font-semibold transition-colors disabled:opacity-50",
                        style.button
                      )}>
                      {isLoading ? "..." : confirmLabel}
                    </button>
                  </div>
                </div>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}
