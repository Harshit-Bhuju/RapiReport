import React from "react";
import { Link } from "react-router-dom";
import { Card, CardBody } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { Map, BarChart3, Users, Trophy, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

const CommunityInsights = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">
          Community insights
        </h1>
        <p className="text-gray-500 font-medium mt-1">
          Aggregated anonymized data on side effects and local health trends. Earn bonus points for contributing.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-none shadow-xl shadow-gray-100/50">
          <CardBody className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-primary-600" />
              </div>
              <h2 className="text-lg font-black text-gray-900">Health heatmaps</h2>
            </div>
            <p className="text-sm text-gray-600">
              Local trends (e.g. flu-like symptoms, common prescriptions) from anonymized community data. Coming soon.
            </p>
          </CardBody>
        </Card>

        <Card className="border-none shadow-xl shadow-gray-100/50">
          <CardBody className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-success-50 flex items-center justify-center">
                <Shield className="w-6 h-6 text-success-600" />
              </div>
              <h2 className="text-lg font-black text-gray-900">Contribute data</h2>
            </div>
            <p className="text-sm text-gray-600">
              Opt in to share anonymized symptom and adherence patterns. You earn bonus points for contributing.
            </p>
            <Button variant="secondary" className="mt-3" disabled>
              Enable (coming soon)
            </Button>
          </CardBody>
        </Card>
      </div>

      <Card className="border-none shadow-xl shadow-gray-100/50 bg-primary-50/50">
        <CardBody className="p-6 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Trophy className="w-10 h-10 text-primary-600" />
            <div>
              <h3 className="font-black text-gray-900">Healthy behavior leaderboard</h3>
              <p className="text-sm text-gray-600">See how you rank on adherence, activity, and engagement.</p>
            </div>
          </div>
          <Link to="/quest-game">
            <Button>View Quest Game & leaderboard</Button>
          </Link>
        </CardBody>
      </Card>

      <p className="text-xs text-gray-400">
        All community data is anonymized and used only to improve public health insights and resource focus.
      </p>
    </div>
  );
};

export default CommunityInsights;
