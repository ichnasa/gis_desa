import { CheckCircle2, AlertCircle, X } from "lucide-react";

export interface ToastMessage {
  id: number;
  type: "success" | "error";
  message: string;
}

export default function Toast({ toast, onClose }: { toast: ToastMessage | null; onClose: () => void }) {
  if (!toast) return null;
  const isError = toast.type === "error";
  const Icon = isError ? AlertCircle : CheckCircle2;
  return (
    <div
      key={toast.id}
      role={isError ? "alert" : "status"}
      className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[1500] w-[calc(100%-2rem)] sm:w-auto max-w-md flex items-start gap-2.5 px-4 py-2.5 bg-[#171717] text-white text-xs font-medium rounded-lg shadow-lg animate-fadeIn"
    >
      <Icon className={`w-4 h-4 flex-shrink-0 ${isError ? "text-[#F87171]" : "text-[#4ADE80]"}`} />
      <span className="leading-relaxed">{toast.message}</span>
      <button onClick={onClose} className="text-white/60 hover:text-white" title="Tutup">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
