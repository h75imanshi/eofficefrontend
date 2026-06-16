import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { Header } from '../../shared/header/header';
import { Footer } from '../../shared/footer/footer';

@Component({
  selector: 'app-main-layout',
  standalone: true,

  imports: [
    RouterOutlet,
    Header,
    Footer
  ],

template: `
  <app-header></app-header>

  <router-outlet></router-outlet>

  <app-footer></app-footer>
`
})
export class MainLayoutComponent {}