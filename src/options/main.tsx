import { createRoot } from 'react-dom/client';
import { OptionsApp } from './OptionsApp';
import '../shared/styles/devlens-theme.css';

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(<OptionsApp />);
}
