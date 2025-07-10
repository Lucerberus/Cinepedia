// src/app/services/dialog.service.ts
import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../dialogs/confirm-dialog/confirm-dialog.component';

@Injectable({
  providedIn: 'root',
})
export class DialogService {
  constructor(private dialog: MatDialog) {}

  apriConfermaAnnulla(messaggio: string = 'Sei sicuro di voler uscire?\nPerderai tutte le modifiche inserite'): Promise<boolean> {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        messaggio,
      },
      width: '300px',
    });

    return dialogRef.afterClosed().toPromise();
  }

  apriConferma(messaggio: string, testoConferma: string = 'Conferma'): Promise<boolean> {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        messaggio,
        testoConferma,
      },
      width: '300px',
    });

    return dialogRef.afterClosed().toPromise();
  }

  

  
apriAvviso({ 
  messaggio, 
  titolo = 'Avviso', 
  testoConferma = 'OK',
  soloConferma=true 
}: { 
  messaggio: string, 
  titolo?: string, 
  testoConferma?: string 
  soloConferma?:boolean
}): Promise<boolean> { 
  const dialogRef = this.dialog.open(ConfirmDialogComponent, {
    data: {
      titolo,
      messaggio,
      soloConferma,
      testoConferma,
    },
    width: '300px',
  });

  return dialogRef.afterClosed().toPromise();
}


}
