import React from "react";
import { Tab } from "@headlessui/react";
import { cn } from "@/lib/utils";

const Tabs = ({ tabs, className }) => {
  return (
    <Tab.Group>
      <Tab.List
        className={cn("flex space-x-1 rounded-xl bg-gray-100 p-1", className)}>
        {tabs.map((tab) => (
          <Tab
            key={tab.id}
            className={({ selected }) =>
              cn(
                "w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all duration-200",
                "ring-white ring-opacity-60 ring-offset-2 focus:outline-none focus:ring-2",
                selected
                  ? "bg-white shadow text-primary-700"
                  : "text-gray-600 hover:bg-white/50 hover:text-gray-900",
              )
            }>
            {tab.title}
          </Tab>
        ))}
      </Tab.List>
      <Tab.Panels className="mt-4">
        {tabs.map((tab) => (
          <Tab.Panel
            key={tab.id}
            className={cn(
              "rounded-xl bg-white p-3",
              "ring-white ring-opacity-60 ring-offset-2 focus:outline-none",
            )}>
            {tab.content}
          </Tab.Panel>
        ))}
      </Tab.Panels>
    </Tab.Group>
  );
};

export default Tabs;
