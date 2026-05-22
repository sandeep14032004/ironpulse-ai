export type Settings = {
  restSeconds: number;
  units: "kg" | "lb";
  notifications: boolean;
  liveGymMode: boolean;
};

export const INITIAL_SETTINGS: Settings = {
  restSeconds: 75,
  units: "kg",
  notifications: true,
  liveGymMode: false,
};

export function purgeLocalGymData() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("ironpulse:state");
  localStorage.removeItem("ironpulse:settings");
  localStorage.removeItem("ironpulse:user");
  for (let i = localStorage.length - 1; i >= 0; i -= 1) {
    const key = localStorage.key(i);
    if (key?.startsWith("ironpulse:progress:")) {
      localStorage.removeItem(key);
    }
  }
}
