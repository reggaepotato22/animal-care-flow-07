/**
 * emergencyAlert.ts
 * Cross-tab emergency sound + alert broadcast.
 *
 * Usage:
 *   broadcastEmergencyAlert({ patientName, patientId })
 *
 * Any tab that has the NotificationContext mounted listens to the
 * "acf_emergency_alerts" BroadcastChannel and plays the siren sound.
 */

export const EMERGENCY_CHANNEL = "acf_emergency_alerts";

export interface EmergencyAlertPayload {
  patientName: string;
  patientId: string;
  chiefComplaint?: string;
  timestamp?: number;
}

/** Play a loud, three-burst sawtooth siren in the current tab. */
export function playEmergencySound(): void {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const bursts = [880, 1100, 880, 1100, 880];
    bursts.forEach((freq, i) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.value = freq;
      const t = ctx.currentTime + i * 0.28;
      gain.gain.setValueAtTime(0.45, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.25);
    });
  } catch {
    // Web Audio not available — silent fail
  }
}

/**
 * Play the sound locally AND broadcast it to all other open tabs
 * so any Triage / Nurse / Vet tab also hears the alert.
 */
export function broadcastEmergencyAlert(payload: EmergencyAlertPayload): void {
  playEmergencySound();
  try {
    const ch = new BroadcastChannel(EMERGENCY_CHANNEL);
    ch.postMessage({ ...payload, timestamp: Date.now() });
    ch.close();
  } catch {}
}
