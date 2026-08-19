import { createRoot } from 'react-dom/client';
import { PopupApp } from './PopupApp';
import '../shared/styles/devlens-theme.css';

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(<PopupApp />);
}
