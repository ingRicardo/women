import { Routes } from '@angular/router';

import { Home } from './components/home/home';
import { Adminsection } from './components/adminsection/adminsection';
import {Publicsection} from './components/publicsection/publicsection';
export const routes: Routes = [
    { path: '', component: Home },
    { path: 'adminsec', component: Adminsection },
    { path: 'publicsec', component: Publicsection }
];
