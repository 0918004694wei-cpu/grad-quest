import React from 'react';
import { createRoot } from 'react-dom/client';
import '../app/globals.css';
import StudyApp from '../components/study-app';

const root = document.getElementById('root');

if (!root) throw new Error('Missing application root element.');

createRoot(root).render(
  <React.StrictMode>
    <StudyApp />
  </React.StrictMode>,
);
