import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  styleUrls: ['./confirm-dialog.component.scss'],
  templateUrl: './confirm-dialog.component.html',
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { 
      titolo:string;//titolo anche questo personalizzabile
      messaggio: string; //questo è il messaggio che dovrà visualizzare, e lo riceve in input
      soloConferma?:boolean; //variabile booleana che mi indica se l'avviso deve essere con due tasti(annulla o conferma) oppure solo un ok
      testoConferma?:string; //testo del tasto conferma personalizzabile
    
    }
  ) {}

  onConferma(): void {
    this.dialogRef.close(true);
  }

  onAnnulla(): void {
    this.dialogRef.close(false);
  }
}
