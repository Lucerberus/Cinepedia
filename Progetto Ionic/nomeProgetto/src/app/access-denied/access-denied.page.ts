import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-access-denied',
  templateUrl: './access-denied.page.html',
  styleUrls: ['./access-denied.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class AccessDeniedPage implements OnInit {

  constructor() { }

  ngOnInit() {
     
  }

}
