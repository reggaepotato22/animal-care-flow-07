import { useEffect } from "react";
import { getAccountScopedKey } from "@/lib/accountStore";
import { loadStoredAppointments, type StoredAppointment } from "@/lib/appointmentStore";

const FIRED_KEY_BASE = "acf_appt_reminders_fired";

type FiredMap = Record<string, Record<string, number>>;

function firedKey() {
  return getAccountScopedKey(FIRED_KEY_BASE);
}

function loadFired(): FiredMap {
  try {
    const raw = localStorage.getItem(firedKey());
    return raw ? (JSON.parse(raw) as FiredMap) : {};
  } catch {
    return {};
  }
}

function saveFired(map: FiredMap) {
  try {
    localStorage.setItem(firedKey(), JSON.stringify(map));
  } catch {}
}

function parseAppointmentDateTime(appt: StoredAppointment): Date | null {
  const date = appt.date;
  const time = appt.time;
  if (!date || !time) return null;
  const dParts = date.split("-");
  const tParts = time.split(":");
  if (dParts.length !== 3 || tParts.length < 2) return null;
  const y = Number(dParts[0]);
  const m = Number(dParts[1]);
  const d = Number(dParts[2]);
  const hh = Number(tParts[0]);
  const mm = Number(tParts[1]);
  if (![y, m, d, hh, mm].every(Number.isFinite)) return null;
  return new Date(y, m - 1, d, hh, mm, 0, 0);
}

function isReminderEligible(status: StoredAppointment["status"]) {
  return status !== "CANCELLED" && status !== "NO_SHOW";
}

export function useAppointmentReminders() {
  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const appts = loadStoredAppointments();
      const fired = loadFired();
      let changed = false;

      appts.forEach((appt) => {
        if (!isReminderEligible(appt.status)) return;
        const dt = parseAppointmentDateTime(appt);
        if (!dt) return;
        const apptTs = dt.getTime();
        if (apptTs <= now) return;

        const offsets = (appt.reminderMinutes && appt.reminderMinutes.length > 0 ? appt.reminderMinutes : [30, 15, 5])
          .filter((n) => Number.isFinite(n) && n > 0)
          .map((n) => Math.floor(n))
          .sort((a, b) => b - a);

        offsets.forEach((mins) => {
          const due = apptTs - mins * 60_000;
          if (now < due) return;
          const already = fired[appt.id]?.[String(mins)];
          if (already) return;
          fired[appt.id] = fired[appt.id] ?? {};
          fired[appt.id][String(mins)] = now;
          changed = true;

          window.dispatchEvent(new CustomEvent("acf:notification", {
            detail: {
              type: "warning",
              message: `Appointment reminder: ${appt.petName} (${appt.type}) in ${mins} minutes at ${appt.time}.`,
              patientId: appt.patientId,
              patientName: appt.petName,
              targetRoles: ["SuperAdmin", "Receptionist", "Vet", "Nurse", "Pharmacist"],
            },
          }));
        });
      });

      if (changed) saveFired(fired);
    };

    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, []);
}

