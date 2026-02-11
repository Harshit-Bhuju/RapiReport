import React from "react";
import { useNavigate } from "react-router-dom";
import { MoveLeft, AlertTriangle } from "lucide-react";
import Button from "../components/ui/Button";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[calc(100vh-80px)] bg-white flex flex-col items-center justify-center p-6 text-center">
      <div className="w-24 h-24 bg-error-50 rounded-full flex items-center justify-center mb-8">
        <AlertTriangle className="w-12 h-12 text-error-500" />
      </div>
      <h1 className="text-6xl md:text-8xl font-black text-gray-900 mb-4">
        404
      </h1>
      <h2 className="text-2xl md:text-3xl font-bold text-gray-700 mb-6">
        Page Not Found
      </h2>
      <p className="text-gray-500 max-w-md mb-12 font-medium">
        Sorry, the page you're looking for doesn't exist or has been moved.
        Check the URL or return home.
      </p>
      <Button
        size="lg"
        onClick={() => navigate("/")}
        className="px-10 rounded-2xl">
        <MoveLeft className="mr-3 w-5 h-5" />
        Back to Home
      </Button>
    </div>
  );
};

export default NotFound;
