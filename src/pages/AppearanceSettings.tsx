import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Palette, Sun, Moon, SunMoon } from "lucide-react";
import { useAppearance } from "@/contexts/AppearanceContext";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

const ACCENTS = [
  { id: "green",  label: "InnoVet", bg: "bg-[#56B246]" },
  { id: "teal",   label: "Teal",   bg: "bg-teal-500"   },
  { id: "blue",   label: "Blue",   bg: "bg-blue-500"   },
  { id: "purple", label: "Purple", bg: "bg-purple-500" },
  { id: "orange", label: "Orange", bg: "bg-orange-500" },
  { id: "rose",   label: "Rose",   bg: "bg-rose-500"   },
] as const;

const THEMES = [
  { id: "light",         label: "Light",         icon: Sun,      cls: "bg-white text-gray-800 border-gray-300" },
  { id: "dark",          label: "Dark",          icon: Moon,     cls: "bg-gray-900 text-gray-100 border-gray-700" },
  { id: "high-contrast", label: "High Contrast", icon: SunMoon,  cls: "bg-black text-yellow-300 border-yellow-400" },
] as const;

const RADII = [
  { id: "none", label: "None",    preview: "rounded-none" },
  { id: "sm",   label: "Small",   preview: "rounded-sm"   },
  { id: "md",   label: "Medium",  preview: "rounded-md"   },
  { id: "lg",   label: "Large",   preview: "rounded-lg"   },
  { id: "full", label: "Full",    preview: "rounded-full" },
] as const;

export default function AppearanceSettings() {
  const { accentColor, setAccentColor, borderRadius, setBorderRadius } = useAppearance();
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Palette className="h-6 w-6 text-primary" />
          Appearance
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Customise the look and feel of InnoVetPro.
        </p>
      </div>

      {/* Theme Mode */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Theme Mode</CardTitle>
          <CardDescription className="text-xs">Choose between light, dark, or high-contrast display.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {THEMES.map(t => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl border-2 transition-all min-w-[100px]",
                    t.cls,
                    theme === t.id ? "border-primary shadow-md ring-1 ring-primary/30" : "hover:border-muted-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs font-semibold">{t.label}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Accent Colour</CardTitle>
          <CardDescription className="text-xs">Choose the primary colour used across the app.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {ACCENTS.map(a => (
              <button
                key={a.id}
                onClick={() => setAccentColor(a.id)}
                className={cn(
                  "flex flex-col items-center gap-1.5 p-2 rounded-lg border-2 transition-all",
                  accentColor === a.id ? "border-primary shadow-md" : "border-border hover:border-muted-foreground"
                )}
              >
                <div className={cn("h-8 w-8 rounded-full", a.bg)} />
                <span className="text-xs font-medium">{a.label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Border Radius</CardTitle>
          <CardDescription className="text-xs">Controls the roundness of buttons, cards, and inputs.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {RADII.map(r => (
              <button
                key={r.id}
                onClick={() => setBorderRadius(r.id)}
                className={cn(
                  "flex flex-col items-center gap-1.5 p-3 border-2 transition-all",
                  r.preview,
                  borderRadius === r.id ? "border-primary shadow-md" : "border-border hover:border-muted-foreground"
                )}
              >
                <div className={cn("h-6 w-10 bg-primary/30 border border-primary/50", r.preview)} />
                <span className="text-xs font-medium">{r.label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
