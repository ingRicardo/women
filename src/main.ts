import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import 'zone.js'; // <--- Add this as the first line

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
