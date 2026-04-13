// ═══════════════════════════════════════════════════════════════════════════
// Select Profile — InnoVetPro · PS4-style profile gate
// ═══════════════════════════════════════════════════════════════════════════
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, LogOut, CheckCircle2 } from "lucide-react";
import { useRole } from "@/contexts/RoleContext";
import { useAuth } from "@/contexts/AuthContext";
import { getStaffProfiles, seedDemoStaffProfiles, type StaffProfile } from "@/lib/staffProfileStore";
import { Navigate } from "react-router-dom";
import type { Role } from "@/lib/rbac";

// ─── Role Config ──────────────────────────────────────────────────────────────
const ROLE_CONFIG: Record<string, { emoji: string; gradient: string; glow: string; badge: string }> = {
  SuperAdmin:   { emoji: "⭐", gradient: "from-amber-500/40  via-yellow-600/25  to-amber-700/10",  glow: "shadow-amber-500/30",  badge: "bg-amber-500/20  text-amber-300  border-amber-500/30" },
  Vet:          { emoji: "🩺", gradient: "from-primary/40    via-emerald-600/25  to-primary/10",   glow: "shadow-primary/30",   badge: "bg-primary/20   text-emerald-300 border-primary/30" },
  Receptionist: { emoji: "📋", gradient: "from-blue-500/40   via-blue-600/25     to-blue-700/10",  glow: "shadow-blue-500/30",  badge: "bg-blue-500/20  text-blue-300    border-blue-500/30" },
  Pharmacist:   { emoji: "💊", gradient: "from-purple-500/40 via-purple-600/25   to-purple-700/10",glow: "shadow-purple-500/30",badge: "bg-purple-500/20 text-purple-300 border-purple-500/30"},
  Nurse:        { emoji: "🏥", gradient: "from-pink-500/40   via-pink-600/25     to-pink-700/10",  glow: "shadow-pink-500/30",  badge: "bg-pink-500/20  text-pink-300    border-pink-500/30" },
  Attendant:    { emoji: "🐾", gradient: "from-orange-500/40 via-orange-600/25   to-orange-700/10",glow: "shadow-orange-500/30",badge: "bg-orange-500/20 text-orange-300 border-orange-500/30"},
};

function getCfg(displayRole: string) {
  return ROLE_CONFIG[displayRole] ?? ROLE_CONFIG["Nurse"];
}

// ─── Profile Card ─────────────────────────────────────────────────────────────
function ProfileCard({
  profile, index, isSelected, onClick,
}: { profile: StaffProfile; index: number; isSelected: boolean; onClick: () => void }) {
  const cfg = getCfg(profile.displayRole);
  return (
    <motion.button
      initial={{ opacity: 0, y: 30, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.07, type: "spring", stiffness: 260, damping: 22 }}
      whileHover={{ scale: 1.06, y: -4 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`
        relative flex flex-col items-center gap-3 p-5 rounded-2xl cursor-pointer
        transition-all duration-200 focus:outline-none
        ${isSelected
          ? "border-2 border-primary bg-primary/10 shadow-lg shadow-primary/30"
          : "border border-white/[0.10] bg-white/[0.04] hover:bg-white/[0.08] hover:border-primary/50"
        }
      `}
      style={{ width: 148, minHeight: 178 }}
    >
      {/* Online indicator */}
      <div className="absolute top-2.5 right-2.5">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
        </span>
      </div>

      {/* Avatar */}
      <div className={`
        relative h-20 w-20 rounded-2xl flex items-center justify-center shrink-0
        bg-gradient-to-br ${cfg.gradient} shadow-lg ${isSelected ? cfg.glow : ""}
        border border-white/[0.12]
      `}>
        <span className="text-3xl select-none" role="img">{cfg.emoji}</span>
        <div className="absolute -bottom-2 -right-2 h-7 w-7 rounded-full bg-white/[0.12] border border-white/20 flex items-center justify-center">
          <span className="text-white text-[10px] font-bold">{profile.initials}</span>
        </div>
      </div>

      {/* Name + role */}
      <div className="text-center space-y-1.5 w-full">
        <p className="text-white text-sm font-semibold leading-tight truncate px-1">{profile.name}</p>
        <span className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${cfg.badge}`}>
          {profile.displayRole}
        </span>
      </div>

      {/* Selected checkmark */}
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          className="absolute top-2 left-2"
        >
          <CheckCircle2 className="h-4 w-4 text-primary" />
        </motion.div>
      )}
    </motion.button>
  );
}

// ─── New Profile Card ─────────────────────────────────────────────────────────
function NewProfileCard({ onClick, index }: { onClick: () => void; index: number }) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 30, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.07 }}
      whileHover={{ scale: 1.04, y: -2 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-3 rounded-2xl cursor-pointer
        border-2 border-dashed border-white/20 hover:border-primary/50 hover:bg-white/[0.04]
        transition-all duration-200 focus:outline-none"
      style={{ width: 148, minHeight: 178 }}
    >
      <div className="h-16 w-16 rounded-2xl border-2 border-dashed border-white/20 flex items-center justify-center">
        <Plus className="h-7 w-7 text-white/40" strokeWidth={1.5} />
      </div>
      <p className="text-white/40 text-xs font-semibold text-center">New Profile</p>
    </motion.button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function SelectProfile() {
  const navigate = useNavigate();
  const { lockProfile, isProfileLocked, role } = useRole();
  const { logout } = useAuth();
  const [profiles, setProfiles] = useState<StaffProfile[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [entering, setEntering] = useState(false);

  // If already locked into a profile, skip to dashboard
  if (isProfileLocked) return <Navigate to="/dashboard" replace />;

  useEffect(() => {
    seedDemoStaffProfiles();
    setProfiles(getStaffProfiles());
  }, []);

  function handleSelect(profile: StaffProfile) {
    if (entering) return;
    setSelected(profile.id);
    setEntering(true);
    setTimeout(() => {
      lockProfile(profile);
      navigate("/dashboard", { replace: true });
    }, 550);
  }

  function handleSignOut() {
    logout();
    try {
      localStorage.removeItem("acf_profile_locked");
      localStorage.removeItem("acf_active_profile");
    } catch {}
    navigate("/login", { replace: true });
  }

  const isSuperAdmin = role === "SuperAdmin";

  return (
    <div
      className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center px-6 py-10"
      style={{ background: "hsl(190 19% 7%)" }}
    >
      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-56 -right-56 w-[700px] h-[700px] rounded-full bg-primary/15 blur-[160px]" />
        <div className="absolute -bottom-56 -left-56 w-[700px] h-[700px] rounded-full bg-teal-600/10 blur-[160px]" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-primary/8 blur-[120px]" />
        {/* Grid pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative text-center mb-12 space-y-3"
      >
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/30 flex items-center justify-center">
            <span className="text-lg">🐾</span>
          </div>
          <span className="text-white/80 text-xl font-bold tracking-tight">
            Inno<span className="text-primary">vet</span>Pro
          </span>
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">
          Who's using InnoVet Pro?
        </h1>
        <p className="text-white/40 text-sm max-w-sm mx-auto">
          Select your profile to continue — session is locked once chosen
        </p>
        <div className="flex items-center justify-center gap-1.5 mt-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-[11px] text-emerald-400 font-medium">Clinic is Live</span>
        </div>
      </motion.div>

      {/* Profile Cards Grid */}
      <div className="relative flex flex-wrap justify-center gap-4 max-w-5xl mx-auto">
        <AnimatePresence>
          {profiles.map((profile, i) => (
            <ProfileCard
              key={profile.id}
              profile={profile}
              index={i}
              isSelected={selected === profile.id}
              onClick={() => handleSelect(profile)}
            />
          ))}
          {isSuperAdmin && (
            <NewProfileCard
              key="new-profile"
              index={profiles.length}
              onClick={() => navigate("/admin/users")}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Entering overlay */}
      <AnimatePresence>
        {entering && selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[hsl(190_19%_7%)] flex flex-col items-center justify-center gap-4"
          >
            {(() => {
              const p = profiles.find(x => x.id === selected);
              if (!p) return null;
              const cfg = getCfg(p.displayRole);
              return (
                <>
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className={`h-28 w-28 rounded-3xl flex items-center justify-center bg-gradient-to-br ${cfg.gradient} shadow-2xl ${cfg.glow}`}
                  >
                    <span className="text-5xl">{cfg.emoji}</span>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="text-center"
                  >
                    <p className="text-white text-xl font-bold">{p.name}</p>
                    <p className="text-white/50 text-sm mt-1">Signing in as {p.displayRole}…</p>
                  </motion.div>
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.1, duration: 0.5, ease: "easeInOut" }}
                    className="w-48 h-1 rounded-full bg-gradient-to-r from-primary/0 via-primary to-primary/0 mt-4"
                  />
                </>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer sign out */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="relative mt-12"
      >
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 text-white/30 hover:text-white/60 transition-colors text-sm group"
        >
          <LogOut className="h-4 w-4 group-hover:text-red-400 transition-colors" strokeWidth={1.5} />
          Sign out
        </button>
      </motion.div>
    </div>
  );
}
