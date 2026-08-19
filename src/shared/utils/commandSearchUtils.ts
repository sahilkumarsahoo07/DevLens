import { ActiveTool } from '../types';

export interface CommandItem {
  id: string;
  title: string;
  category: string;
  shortcut?: string;
  iconName: string;
  tool: ActiveTool | 'full-screenshot' | 'open-settings' | 'clear';
}

export const COMMAND_LIST: CommandItem[] = [
  { id: 'tool-inspect', title: 'Element Inspector', category: 'Inspection', shortcut: 'Alt+Shift+I', iconName: 'Search', tool: 'inspect' },
  { id: 'tool-typography', title: 'Typography Inspector', category: 'Inspection', shortcut: 'Alt+Shift+F', iconName: 'Type', tool: 'typography' },
  { id: 'tool-color', title: 'Color Picker & Contrast', category: 'Inspection', shortcut: 'Alt+Shift+C', iconName: 'Palette', tool: 'color' },
  { id: 'tool-box-model', title: 'Box Model Inspector', category: 'Layout', iconName: 'Square', tool: 'box-model' },
  { id: 'tool-layout', title: 'Layout Inspector (Flex/Grid)', category: 'Layout', iconName: 'LayoutGrid', tool: 'layout' },
  { id: 'tool-measure', title: 'Pixel Measurement Tool', category: 'Tools', shortcut: 'Alt+Shift+M', iconName: 'Ruler', tool: 'measure' },
  { id: 'tool-responsive', title: 'Responsive Viewport Tester', category: 'Tools', shortcut: 'Alt+Shift+R', iconName: 'Smartphone', tool: 'responsive' },
  { id: 'tool-network', title: 'API & Network Inspector', category: 'Tools', shortcut: 'Alt+Shift+N', iconName: 'Radio', tool: 'network' },
  { id: 'tool-a11y', title: 'Accessibility Checker', category: 'Audit', shortcut: 'Alt+Shift+A', iconName: 'Accessibility', tool: 'a11y' },
  { id: 'tool-page-analyzer', title: 'Page Tech & Overview Analyzer', category: 'Audit', iconName: 'BarChart2', tool: 'page-analyzer' },
  { id: 'tool-screenshot-visible', title: 'Visible Area Screenshot', category: 'Capture', shortcut: 'Alt+Shift+S', iconName: 'Camera', tool: 'screenshot' },
  { id: 'tool-screenshot-full', title: 'Full Page Screenshot', category: 'Capture', iconName: 'Maximize2', tool: 'full-screenshot' },
  { id: 'tool-video-recorder', title: 'Screen & Video Recorder', category: 'Capture', shortcut: 'Alt+Shift+V', iconName: 'Video', tool: 'video-recorder' },
  { id: 'action-settings', title: 'Extension Settings', category: 'System', iconName: 'Settings', tool: 'open-settings' }
];

export function filterCommands(query: string): CommandItem[] {
  if (!query || query.trim() === '') return COMMAND_LIST;
  const q = query.toLowerCase().trim();
  return COMMAND_LIST.filter(
    (cmd) =>
      cmd.title.toLowerCase().includes(q) ||
      cmd.category.toLowerCase().includes(q) ||
      (cmd.shortcut && cmd.shortcut.toLowerCase().includes(q))
  );
}
