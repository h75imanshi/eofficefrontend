import { Routes } from '@angular/router';

import { LoginComponent } from './components/login/login.component';
import { SignupComponent } from './components/signup/signup.component';
import { SearchDashboardComponent } from './components/search-dashboard/search-dashboard.component';
import { PressSearchComponent } from './components/press-search/press-search.component';

import { AuthLayoutComponent } from './components/layouts/auth-layout/auth-layout';
import { MainLayoutComponent } from './components/layouts/main-layout/main-layout';

export const routes: Routes = [

  // Default Route
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },

  // Login / Signup Layout
  {
    path: '',
    component: AuthLayoutComponent,
    children: [
      {
        path: 'login',
        component: LoginComponent
      },
      {
        path: 'signup',
        component: SignupComponent
      }
    ]
  },

  // Main Application Layout
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: 'dashboard',
        component: SearchDashboardComponent
      },
      {
        path: 'printing-press',
        component: PressSearchComponent
      }
    ]
  },

  // Invalid URL
  {
    path: '**',
    redirectTo: 'login'
  }

];