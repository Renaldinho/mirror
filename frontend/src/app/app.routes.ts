import { Routes } from '@angular/router';
import { MirrorPage } from './dashboard/mirror-page';

export const routes: Routes = [
  { path: '', component: MirrorPage },
  { path: '**', redirectTo: '' },
];
