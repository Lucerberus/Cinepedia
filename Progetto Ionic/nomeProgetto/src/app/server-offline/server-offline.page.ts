import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonIcon,IonSpinner,IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-server-offline',
  templateUrl: './server-offline.page.html',
  styleUrls: ['./server-offline.page.scss'],
  standalone: true,
  imports: [ IonIcon,IonSpinner,IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class ServerOfflinePage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
