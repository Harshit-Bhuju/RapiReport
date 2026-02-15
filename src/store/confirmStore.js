import { create } from "zustand";

/**
 * Global confirm modal store. Use openConfirm() from anywhere to show
 * a floating confirmation modal for delete or other destructive actions.
 *
 * @example
 * openConfirm({
 *   title: "Delete report?",
 *   message: "This will permanently remove this report.",
 *   confirmLabel: "Delete",
 *   variant: "danger",
 *   onConfirm: async () => { await removeReport(id); toast.success("Deleted"); },
 * });
 */
export const useConfirmStore = create((set) => ({
  isOpen: false,
  title: "",
  message: "",
  confirmLabel: "Confirm",
  cancelLabel: "Cancel",
  variant: "danger", // "danger" | "warning" | "primary"
  isLoading: false,
  onConfirm: null,
  onCancel: null,

  openConfirm: (options = {}) => {
    set({
      isOpen: true,
      title: options.title ?? "Confirm",
      message: options.message ?? "Are you sure?",
      confirmLabel: options.confirmLabel ?? "Confirm",
      cancelLabel: options.cancelLabel ?? "Cancel",
      variant: options.variant ?? "danger",
      isLoading: false,
      onConfirm: options.onConfirm ?? (() => {}),
      onCancel: options.onCancel ?? (() => {}),
    });
  },

  closeConfirm: () => {
    set({
      isOpen: false,
      onConfirm: null,
      onCancel: null,
      isLoading: false,
    });
  },

  setConfirmLoading: (loading) => {
    set({ isLoading: loading });
  },
}));
