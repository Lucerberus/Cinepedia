import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonFooter, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  standalone: true,
  imports: [CommonModule, IonFooter, IonToolbar]
})
export class FooterComponent {}