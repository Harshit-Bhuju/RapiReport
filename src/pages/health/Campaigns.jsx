import React, { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardBody } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { Syringe, Stethoscope, Trophy, Calendar, Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import API from "@/Configs/ApiEndpoints";

const Campaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [completedIds, setCompletedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(null);

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const r = await axios.get(API.CAMPAIGNS_LIST, { withCredentials: true });
        if (r.data?.status === "success") {
          setCampaigns(r.data.data ?? []);
          setCompletedIds(new Set(r.data.completedIds ?? []));
        }
      } catch (e) {
        console.warn("Campaigns fetch failed", e);
        toast.error("Could not load campaigns.");
      } finally {
        setLoading(false);
      }
    };
    fetchCampaigns();
  }, []);

  const handleComplete = async (campaign) => {
    setCompleting(campaign.id);
    try {
      const r = await axios.post(API.CAMPAIGNS_COMPLETE, { campaign_id: campaign.id }, { withCredentials: true });
      if (r.data?.status === "success") {
        setCompletedIds((s) => new Set(s).add(campaign.id));
        toast.success(`+${r.data.pointsAwarded ?? campaign.points} points earned!`);
      } else {
        toast.error(r.data?.message || "Could not complete.");
      }
    } catch (e) {
      toast.error(e.response?.data?.message || "Could not complete.");
    } finally {
      setCompleting(null);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case "vaccination":
        return <Syringe className="w-6 h-6 text-primary-600" />;
      case "checkup":
        return <Stethoscope className="w-6 h-6 text-success-600" />;
      case "fitness":
        return <Trophy className="w-6 h-6 text-warning-600" />;
      default:
        return <Calendar className="w-6 h-6 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">
          Preventive campaigns
        </h1>
        <p className="text-gray-500 font-medium mt-1">
          Vaccinations, checkups, and fitness challenges. Earn points for participating.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {campaigns.map((c) => {
          const done = completedIds.has(c.id);
          const busy = completing === c.id;
          return (
            <Card
              key={c.id}
              className={cn(
                "border-none shadow-xl shadow-gray-100/50 overflow-hidden transition-all",
                done && "ring-2 ring-success-200 bg-success-50/30",
              )}
            >
              <CardBody className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white border border-gray-100 flex items-center justify-center shrink-0">
                    {getIcon(c.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      {c.type}
                    </p>
                    <h3 className="text-lg font-black text-gray-900 mt-0.5">
                      {c.title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-2">
                      {c.description}
                    </p>
                    <div className="flex items-center gap-4 mt-3">
                      <span className="text-sm font-bold text-primary-600">
                        +{c.points} pts
                      </span>
                      <span className="text-xs text-gray-400">
                        Until {c.deadline ? new Date(c.deadline).toLocaleDateString() : "—"}
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={() => handleComplete(c)}
                  disabled={done || busy}
                  variant={done ? "secondary" : "primary"}
                  className={cn("w-full mt-4 gap-2", (done || busy) && "opacity-70")}
                >
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : done ? <Check className="w-4 h-4" /> : null}
                  {busy ? "Submitting…" : done ? "Completed" : c.cta || "Complete"}
                </Button>
              </CardBody>
            </Card>
          );
        })}
      </div>
      <p className="text-xs text-gray-400 text-center">
        Points are added to your account and can be used in the Marketplace.
      </p>
    </div>
  );
};

export default Campaigns;
