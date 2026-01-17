import { Loader2 } from "lucide-react";

interface LoaderProps {
  fullScreen?: boolean;
  text?: string;
  className?: string;
}

export default function Loader({ fullScreen = false, text = "Loading...", className = "" }: LoaderProps) {
  if (fullScreen) {
    return (
      <div className={`fixed inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-50 ${className}`}>
        <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
        <p className="text-gray-600 font-medium text-lg animate-pulse">{text}</p>
      </div>
    );
  }

  return (
    <div className={`w-full flex flex-col items-center justify-center p-8 ${className}`}>
      <Loader2 className="animate-spin text-blue-600 mb-3" size={32} />
      <p className="text-gray-500 text-sm font-medium">{text}</p>
    </div>
  );
}
