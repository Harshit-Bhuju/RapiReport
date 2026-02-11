import React, { Fragment } from "react";
import { Menu, Transition } from "@headlessui/react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const Dropdown = ({ label, items, className }) => {
  return (
    <Menu as="div" className={cn("relative inline-block text-left", className)}>
      <Menu.Button className="btn-secondary flex items-center gap-2">
        {label}
        <ChevronDown className="w-4 h-4" />
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95">
        <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
          <div className="p-1">
            {items.map((item, idx) => (
              <Menu.Item key={idx}>
                {({ active }) => (
                  <button
                    onClick={item.onClick}
                    className={cn(
                      "group flex w-full items-center rounded-md px-3 py-2.5 text-sm transition-colors",
                      active
                        ? "bg-primary-50 text-primary-900"
                        : "text-gray-900",
                    )}>
                    {item.icon && <item.icon className="mr-2 h-4 w-4" />}
                    {item.label}
                  </button>
                )}
              </Menu.Item>
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
};

export default Dropdown;
