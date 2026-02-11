import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { Pill, Clock, Info, ExternalLink } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

const MedicineInsight = ({ medicines }) => {
  const { t, i18n } = useTranslation();

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
          <Pill className="text-primary-600 w-6 h-6" />
          Medicine Intelligence
        </h3>
        <Badge variant="info">AI Suggested</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {medicines.map((med, idx) => (
          <Card
            key={idx}
            className="border-gray-50 bg-white hover:border-primary-100 transition-all group">
            <CardBody className="p-5">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
                    {med.name}
                  </h4>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-tighter">
                    {med.type} • {med.dosage}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-gray-50 group-hover:bg-primary-50 transition-colors">
                  <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-primary-600" />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded-lg font-medium">
                  <Clock className="w-4 h-4 text-primary-500" />
                  {i18n.language === "ne" ? med.timingNe : med.timingEn}
                </div>
                <div className="flex items-start gap-2 text-xs text-gray-500 leading-relaxed">
                  <Info className="w-4 h-4 text-gray-300 mt-0.5 shrink-0" />
                  <span>
                    {i18n.language === "ne" ? med.descNe : med.descEn}
                  </span>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default MedicineInsight;
