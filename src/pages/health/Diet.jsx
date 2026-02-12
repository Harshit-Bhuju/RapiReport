import React, { useState, useMemo, useEffect } from "react";
import { Card, CardBody } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useHealthStore } from "@/store/healthStore";
import { Utensils, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { format, subDays } from "date-fns";

const MEAL_TYPES = [
  { key: "breakfast", label: "Breakfast" },
  { key: "lunch", label: "Lunch" },
  { key: "dinner", label: "Dinner" },
  { key: "snack", label: "Snack" },
];

const Diet = () => {
  const { dietLogs, addDietLog, removeDietLog, fetchDietLogs } = useHealthStore();
  useEffect(() => { fetchDietLogs(); }, [fetchDietLogs]);
  const [mealType, setMealType] = useState("breakfast");
  const [items, setItems] = useState("");
  const [note, setNote] = useState("");

  const handleAdd = () => {
    if (!items.trim()) {
      toast.error("Add what you ate.");
      return;
    }
    addDietLog({
      mealType,
      items: items.trim(),
      note: note.trim() || undefined,
    });
    setItems("");
    setNote("");
    toast.success("Meal logged.");
  };

  const last7 = useMemo(() => {
    const cutoff = subDays(new Date(), 7).toISOString().slice(0, 10);
    return dietLogs
      .filter((d) => d.date >= cutoff)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [dietLogs]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">
          Diet & nutrition
        </h1>
        <p className="text-gray-500 font-medium mt-1">
          Log meals to track eating habits. AI diet checks can be added later.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="border-none shadow-xl shadow-gray-100/50">
          <CardBody className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-success-50 flex items-center justify-center text-success-600">
                <Utensils className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Log meal</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-bold text-gray-700 mb-2 block">Meal</label>
                <div className="flex gap-2 flex-wrap">
                  {MEAL_TYPES.map((m) => (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() => setMealType(m.key)}
                      className={cn(
                        "px-4 py-2 rounded-xl border-2 text-sm font-bold transition-all",
                        mealType === m.key
                          ? "bg-primary-50 border-primary-600 text-primary-700"
                          : "border-gray-100 text-gray-500",
                      )}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                className="w-full p-4 rounded-xl border-2 border-gray-100 focus:border-primary-500 focus:ring-0 min-h-[80px] resize-none text-sm"
                placeholder="What did you eat? e.g. Rice, dal, vegetables..."
                value={items}
                onChange={(e) => setItems(e.target.value)}
              />
              <Input
                label="Note (optional)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Light lunch"
              />
              <Button onClick={handleAdd} className="w-full gap-2">
                <Plus className="w-4 h-4" /> Add meal
              </Button>
            </div>
          </CardBody>
        </Card>

        <div className="lg:col-span-2">
          <Card className="border-none shadow-xl shadow-gray-100/50">
            <CardBody className="p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Last 7 days</h2>
              {last7.length === 0 ? (
                <p className="text-sm text-gray-500 font-medium">No meals logged yet.</p>
              ) : (
                <div className="space-y-3">
                  {last7.map((d) => (
                    <div
                      key={d.id}
                      className="flex items-start justify-between p-4 rounded-2xl border border-gray-100 bg-white"
                    >
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                          {MEAL_TYPES.find((m) => m.key === d.mealType)?.label} •{" "}
                          {format(new Date(d.date), "MMM d")}
                        </p>
                        <p className="font-medium text-gray-900 mt-1">{d.items}</p>
                        {d.note && (
                          <p className="text-xs text-gray-500 mt-0.5">{d.note}</p>
                        )}
                      </div>
                      <button
                        onClick={() => removeDietLog(d.id)}
                        className="text-xs font-bold text-error-600 hover:bg-error-50 px-2 py-1 rounded-lg shrink-0"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Diet;
