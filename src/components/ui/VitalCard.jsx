import { Card, CardContent } from "./Card";
import { cn } from "../../lib/utils";
import { Activity, Heart, Scale } from "lucide-react";

const ICONS = {
  heart: Heart,
  activity: Activity,
  scale: Scale,
};

const VitalCard = ({ title, value, unit, status = "normal", icon, trend }) => {
  const Icon = ICONS[icon] || Activity;

  const statusColors = {
    normal: "text-success-700 bg-success-50",
    warning: "text-warning-700 bg-warning-50",
    critical: "text-error-700 bg-error-50",
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className={cn("p-3 rounded-full", statusColors[status])}>
            <Icon className="w-6 h-6" />
          </div>
          {trend && (
            <span
              className={cn(
                "text-xs font-medium px-2 py-1 rounded-full",
                trend > 0
                  ? "bg-red-100 text-red-700"
                  : "bg-green-100 text-green-700",
              )}>
              {trend > 0 ? "+" : ""}
              {trend}%
            </span>
          )}
        </div>
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <div className="flex items-baseline mt-1 space-x-2">
            <span className="text-2xl font-bold text-gray-900">{value}</span>
            <span className="text-sm text-gray-500">{unit}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export { VitalCard };
