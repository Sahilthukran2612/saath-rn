import { ClipboardList, Droplet, Footprints, Pill, Utensils } from './icons';

// Tasks keep an emoji in their data (so older saved state still works); the screen shows a line icon.
const MAP = { '💊': Pill, '🍚': Utensils, '🚶': Footprints, '🩸': Droplet };
export const taskIcon = (task) => MAP[task.icon] || ClipboardList;
