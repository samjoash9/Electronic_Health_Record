// One colour per station, shared by the dashboard's Station Overview bar and
// the station report cards so a station reads the same everywhere.
export const STATION_CONFIG = [
  { id: 1, name: 'Station 1', bgClass: 'bg-sky-500', hex: '#0ea5e9' },
  { id: 2, name: 'Station 2', bgClass: 'bg-emerald-500', hex: '#10b981' },
  { id: 3, name: 'Station 3', bgClass: 'bg-violet-500', hex: '#8b5cf6' },
  { id: 4, name: 'Station 4', bgClass: 'bg-amber-500', hex: '#f59e0b' },
  { id: 5, name: 'Station 5', bgClass: 'bg-rose-500', hex: '#f43f5e' },
  { id: 6, name: 'Station 6', bgClass: 'bg-teal-500', hex: '#14b8a6' },
];

export const stationById = (id) => STATION_CONFIG.find((st) => st.id === id);
