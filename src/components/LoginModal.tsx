import { useState } from "react";
import { X, LogIn, Loader2 } from "lucide-react";
import { getSupabase } from "../lib/supabase";

export interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    setPassword("");
    setError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const { error: authError } = await getSupabase().auth.signInWithPassword({ email: email.trim(), password });
      if (authError) {
        setError(
          authError.message.includes("Invalid login credentials")
            ? "Email atau kata sandi salah."
            : `Gagal masuk: ${authError.message}`
        );
        return;
      }
      setPassword("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal masuk.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-[#E5E5E5] rounded-xl shadow-xl max-w-sm w-full p-6 space-y-4 text-[#171717] animate-fadeIn"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#171717] text-white flex items-center justify-center">
              <LogIn className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-base">Masuk Operator</h3>
              <p className="text-xs text-[#737373]">Untuk menambah dan mengubah data desa</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1 rounded-md text-[#737373] hover:text-[#171717] hover:bg-[#F5F5F5] transition"
            title="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <label className="block space-y-1">
            <span className="text-xs font-medium">Email</span>
            <input
              type="email"
              required
              autoFocus
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#E5E5E5] rounded-md focus:outline-none focus:border-[#171717] focus:ring-1 focus:ring-[#171717]"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-medium">Kata Sandi</span>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#E5E5E5] rounded-md focus:outline-none focus:border-[#171717] focus:ring-1 focus:ring-[#171717]"
            />
          </label>
        </div>

        {error && (
          <div className="px-3 py-2 text-xs text-[#D44C47] bg-[#FDF2F2] border border-[#F5D0CE] rounded-md">{error}</div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 py-2 bg-[#171717] hover:bg-[#262626] text-white text-sm font-medium rounded-md transition disabled:opacity-60"
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          Masuk
        </button>

        <p className="text-[11px] text-[#737373] text-center">
          Akun operator dibuat oleh admin desa. Pengunjung umum tidak perlu masuk untuk melihat peta.
        </p>
      </form>
    </div>
  );
}
