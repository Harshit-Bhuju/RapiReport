import React, { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Upload, X, FileText, Loader2, ArrowRight, Zap } from "lucide-react";
import Button from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

const ReportUpload = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const processFile = (selectedFile) => {
    // Check if file is an image
    if (!selectedFile.type.startsWith("image/")) {
      // In a real app, we'd show a toast error here
      return;
    }

    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      processFile(droppedFile);
    }
  };

  const handleAnalyze = () => {
    if (!file) return;

    setIsAnalyzing(true);

    // Simulate API analysis time
    setTimeout(() => {
      setIsAnalyzing(false);
      // Navigate to a mock result ID (e.g., "3" which uses the same mock data structure as "1" but we can customize if needed)
      // For now, let's just go to "1" to show the populated data, or we could pass state to Results.jsx
      navigate("/results/analysis-complete");
    }, 3000);
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-black text-gray-900">
          {t("uploadReport.title") || "Upload Your Report"}
        </h2>
        <p className="text-gray-500 font-medium max-w-md mx-auto">
          {t("uploadReport.subtitle") ||
            "Upload a clear photo of your medical report. Our AI will analyze it to provide detailed insights."}
        </p>
      </div>

      <Card
        className={cn(
          "border-2 border-dashed transition-all duration-300 overflow-hidden",
          isDragOver
            ? "border-primary-500 bg-primary-50 Scale-[1.02]"
            : "border-gray-200 bg-gray-50/50 hover:border-primary-200",
        )}>
        <CardBody
          className="p-10 flex flex-col items-center justify-center min-h-[300px] cursor-pointer"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
          />

          {!file ? (
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 mb-2">
                <Upload className="w-10 h-10" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">
                  {t("uploadReport.clickToUpload") || "Click to upload"}
                </p>
                <p className="text-sm text-gray-500 font-medium mt-1">
                  {t("uploadReport.dragDrop") || "or drag and drop"}
                </p>
              </div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                PNG, JPG, JPEG (Max 5MB)
              </p>
            </div>
          ) : (
            <div className="w-full relative group">
              <Button
                size="icon"
                variant="destructive"
                className="absolute -top-2 -right-2 z-10 shadow-lg"
                onClick={(e) => {
                  e.stopPropagation();
                  clearFile();
                }}>
                <X className="w-4 h-4" />
              </Button>
              <img
                src={preview}
                alt="Preview"
                className="w-full h-auto max-h-[400px] object-contain rounded-xl shadow-sm"
              />
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/75 text-white px-4 py-2 rounded-full text-sm font-medium backdrop-blur-md">
                {file.name}
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      <div className="flex justify-center">
        <Button
          size="lg"
          disabled={!file || isAnalyzing}
          onClick={handleAnalyze}
          className="min-w-[200px] h-14 text-lg shadow-xl shadow-primary-200">
          {isAnalyzing ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              {t("uploadReport.analyzing") || "Analyzing..."}
            </>
          ) : (
            <>
              <Zap className="w-5 h-5 mr-2 fill-current" />
              {t("uploadReport.analyzeAction") || "Analyze Report"}
            </>
          )}
        </Button>
      </div>

      {isAnalyzing && (
        <div className="text-center space-y-2 animate-pulse">
          <p className="text-primary-600 font-bold">
            {t("uploadReport.processing") || "Reading document structure..."}
          </p>
          <div className="w-64 h-2 bg-gray-100 rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-primary-500 animate-progress origin-left" />
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportUpload;
