import { Component, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Title, Meta } from '@angular/platform-browser';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet, 
    MatToolbarModule, 
    MatButtonModule, 
    MatCardModule, 
    MatInputModule, 
    MatFormFieldModule, 
    MatIconModule, 
    MatListModule, 
    MatSidenavModule, 
    MatTabsModule, 
    MatTooltipModule
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit{
  constructor(private titleService: Title, private metaService: Meta) {}

  ngOnInit() {
    // Ustawianie tytułu strony
    this.titleService.setTitle('Unitly');

    // Ustawianie metadanych (np. opis dla wyszukiwarek)
    this.metaService.addTags([
      { name: 'description', content: 'Opis Twojej aplikacji stworzony z myślą o SEO.' },
      { name: 'keywords', content: 'unitly' },
      { property: 'og:title', content: 'Unitly' }
    ]);
  }
}
