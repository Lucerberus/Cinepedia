import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, interval, of, startWith, switchMap } from 'rxjs';
import { BehaviorSubject } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ServerStatusService {
  private serverAvailable = new BehaviorSubject<boolean>(true);
  public status$ = this.serverAvailable.asObservable(); //controlla in tempo reale il valore di sererAvailable

  constructor(private http: HttpClient) {
    this.monitorServer();//avviamo il controllo del server
  }

  private monitorServer() {
    //ogni 10 secondi il sito invia un ping al server per capire se è attivo oppure no
    interval(10000).pipe(
      startWith(0),//all'avvio del sito lo controlliamo subito il server senza aspettare 10 secondi
      switchMap(() =>
          this.http.get(`${environment.IP}/ping`, { responseType: 'text' }).pipe(
            catchError(() => of(null)) // errore = server non raggiungibile, lo controlliamo così che non restituisce errore ma restituisce null
          )
        )
      )
      .subscribe(response => {
        this.serverAvailable.next(!!response);//usando !! convertiamo il valore in booleano, se abbiamo null diventa false se abbiamo qualcosa abbiamo true, 
        //nel nostro caso se il server è acceso restitutisce una stringa /pong, che farà si che response sia true
        //aggiorniamo il valore di serverAvailable  
      });
  }
}
