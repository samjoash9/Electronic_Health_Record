import {
  Brain, BrainCircuit, ClipboardList, HeartHandshake, HeartPulse, Landmark, Sparkles, Users,
} from 'lucide-react';

// CATEGORY_STYLES names each category's icon as a string. Resolving those
// names against `import * as Icons` kept every lucide icon (~700 kB) in the
// bundle, so only the names the styles actually use are mapped here -- add
// to this list when adding an icon to CATEGORY_STYLES.
export const CATEGORY_ICONS = {
  Brain, BrainCircuit, ClipboardList, HeartHandshake, HeartPulse, Landmark, Sparkles, Users,
};
