import { useState } from "react";
import { useAuthStore } from "../../stores/authStore";
import { AlertCircle, X, User } from "lucide-react";

export const AnonymousBanner: React.FC = () => {
  const { user } = useAuthStore();
  const [isDismissed, setIsDismissed] = useState(false);

  // Don't show banner if user is not anonymous or if dismissed
  if (!user?.is_anonymous || isDismissed) {
    return null;
  }

  return (
    <>
      <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-foreground">
                <span className="font-semibold">
                  You're using VLab as a guest.
                </span>{" "}
                Your data is saved locally in this browser. Create your account
                to access from any device and keep your projects permanently
                safe.
              </p>
              <p className="text-xs text-foreground">
                <span className="text-amber-300 font-medium">
                  {" "}
                  ⚠️ This data won't sync to other devices or survive browser
                  data clearing.
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => window.open("/landing?signup=true", "_blank")}
              className="btn-primary text-xs"
            >
              <User className="w-4 h-4 mr-2" />
              <span>Create Account</span>
            </button>
            <button
              onClick={() => setIsDismissed(true)}
              className="text-foreground-dim hover:text-foreground transition-colors p-1"
              aria-label="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
