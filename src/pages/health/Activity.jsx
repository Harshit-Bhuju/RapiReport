import React, { useState, useMemo, useEffect } from "react";
import { Card, CardBody } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useHealthStore } from "@/store/healthStore";
import { Footprints, Moon, Dumbbell, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { format, subDays } from "date-fns";

const TYPES = [
  { key: "steps", label: "Steps", unit: "steps", icon: Footprints },
  { key: "workout", label: "Workout", unit: "min", icon: Dumbbell },
  { key: "sleep", label: "Sleep", unit: "hrs", icon: Moon },
];

const Activity = () => {
  const { activityLogs, addActivity, removeActivity, fetchActivityLogs } = useHealthStore();
  useEffect(() => { fetchActivityLogs(); }, [fetchActivityLogs]);
  const [type, setType] = useState("steps");
  const [value, setValue] = useState("");
  const [note, setNote] = useState("");

  const handleAdd = () => {
    const num = Number(value);
    if (isNaN(num) || num <= 0) {
      toast.error("Enter a valid number.");
      return;
    }
    const t = TYPES.find((x) => x.key === type);
    addActivity({
      type,
      value: num,
      unit: t?.unit || "",
      note: note.trim() || undefined,
    });
    setValue("");
    setNote("");
    toast.success("Activity logged.");
  };

  const last7 = useMemo(() => {
    const cutoff = subDays(new Date(), 7).toISOString().slice(0, 10);
    return activityLogs
      .filter((a) => a.date >= cutoff)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [activityLogs]);

  const todaySteps = useMemo(
    () =>
      activityLogs
        .filter((a) => a.date === new Date().toISOString().slice(0, 10) && a.type === "steps")
        .reduce((s, a) => s + (a.value || 0), 0),
    [activityLogs],
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">
          Activity
        </h1>
        <p className="text-gray-500 font-medium mt-1">
          Log steps, workouts, and sleep. Earn points for goals.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-none shadow-lg shadow-gray-100/50">
          <CardBody className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
                <Footprints className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-black text-gray-900">{todaySteps}</p>
                <p className="text-xs font-bold text-gray-500">Steps today</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="border-none shadow-xl shadow-gray-100/50">
          <CardBody className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
                <Plus className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Log activity</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-bold text-gray-700 mb-2 block">Type</label>
                <div className="flex gap-2 flex-wrap">
                  {TYPES.map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setType(t.key)}
                      className={cn(
                        "px-4 py-2 rounded-xl border-2 text-sm font-bold transition-all flex items-center gap-2",
                        type === t.key
                          ? "bg-primary-50 border-primary-600 text-primary-700"
                          : "border-gray-100 text-gray-500",
                      )}
                    >
                      <t.icon className="w-4 h-4" /> {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <Input
                label={TYPES.find((t) => t.key === type)?.unit === "steps" ? "Steps" : "Value"}
                type="number"
                min="0"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={type === "sleep" ? "e.g. 7" : type === "workout" ? "e.g. 30" : "e.g. 5000"}
              />
              <Input
                label="Note (optional)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Morning walk"
              />
              <Button onClick={handleAdd} className="w-full gap-2">
                <Plus className="w-4 h-4" /> Add
              </Button>
            </div>
          </CardBody>
        </Card>

        <div className="lg:col-span-2">
          <Card className="border-none shadow-xl shadow-gray-100/50">
            <CardBody className="p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Recent activity</h2>
              {last7.length === 0 ? (
                <p className="text-sm text-gray-500 font-medium">No entries yet.</p>
              ) : (
                <div className="space-y-3">
                  {last7.map((a) => {
                    const T = TYPES.find((t) => t.key === a.type);
                    return (
                      <div
                        key={a.id}
                        className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 bg-white"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600">
                            {T && <T.icon className="w-5 h-5" />}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">
                              {a.value} {a.unit}
                            </p>
                            <p className="text-xs text-gray-500">
                              {format(new Date(a.date), "MMM d")}
                              {a.note ? ` • ${a.note}` : ""}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeActivity(a.id)}
                          className="text-xs font-bold text-error-600 hover:bg-error-50 px-2 py-1 rounded-lg"
                        >
                          Delete
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Activity;
