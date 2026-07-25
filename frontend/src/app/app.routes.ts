import { Routes } from '@angular/router';
import { MirrorPage } from './dashboard/mirror-page';
import { RemotePage } from './remote/remote-page';

export const routes: Routes = [
  { path: '', component: MirrorPage },
  { path: 'remote', component: RemotePage },
  { path: '**', redirectTo: '' },
];
