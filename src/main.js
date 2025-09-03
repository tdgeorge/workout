import { loadState } from './state.js';
import { setDarkMode } from './darkmode.js';
import { renderUI } from './ui.js';

setDarkMode();
loadState();
renderUI();
