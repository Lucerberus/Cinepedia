import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GetImageService {

  constructor() { }


//funzionante per rimuovi attore e rimuovi film e carica film
getImage1(path: string | ArrayBuffer | null | undefined): string {
  

 if (typeof path === 'string') {
  if (path.startsWith('data:image')) {
      return path; // immagine base64 caricata da utente
    }
    
    if (path.startsWith('/')) {
      return `https://image.tmdb.org/t/p/w780${path}`; // immagine da TMDB
    }
    else{
      if (path.includes('film_img')  || path.includes('attori_img') || path.includes('utenti')) {
      return `${environment.IP}/uploads/${path}`; // immagine dal nostro server
  }else{
      return "assets/icon/default-attore.svg"; // immagine di default
  }
      
    }

  }

 return "assets/icon/default-attore.svg";  //ritorno immagine di default in caso non fosse una stringa
}


//funzionante per modifica attore e modifica film
getImage2(path: string | ArrayBuffer | null | undefined,previewImageFilm:any): string {
  const anteprima = previewImageFilm;

 if (anteprima && typeof anteprima === 'string') {
    return anteprima; 
  }

  if (!path || path === '') {
    return 'assets/icon/default-user.svg';
  }


   if (typeof path === 'string') {
    if (path.startsWith('data:image')) {
      return path; // immagine base64 caricata da utente
    }
    
    if (path.startsWith('/')) {
      return `https://image.tmdb.org/t/p/w780${path}`; // immagine da TMDB
    }
    else{
      if (path.includes('film_img')  || path.includes('attori_img') || path.includes('utenti')) {
      return `${environment.IP}/uploads/${path}`; // immagine dal nostro server
  }else{
      return "assets/icon/default-attore.svg"; // immagine di default
  }
      
    }

  }

 return "assets/icon/default-attore.svg";  //ritorno immagine di default in caso non fosse una stringa
}



//per la preview in  modifica film e carica film
getPreviewImage(attore?: any,attoreCorrente?:any,previewImageAttore?:any): string {
  const path = attore
    ? attore.profile_path
    : attoreCorrente.profile_path;

  const anteprima = attore
    ? null
    : previewImageAttore;

  if (!path || path === '') {
    return anteprima && typeof anteprima === 'string'
      ? anteprima
      : 'assets/icon/default-attore.svg';
  }

  if (typeof path === 'string') {
    if (path.startsWith('data:image')) {
      return path; // immagine base64 caricata da utente
    }
    
    if (path.startsWith('/')) {
      return `https://image.tmdb.org/t/p/w780${path}`; // immagine da TMDB
    }
    else{
      if (path.includes('film_img')  || path.includes('attori_img') || path.includes('utenti')) {
      return `${environment.IP}/uploads/${path}`; // immagine dal nostro server
  }else{
      return "assets/icon/default-attore.svg"; // immagine di default
  }
      
    }

  }

  return 'assets/icon/default-attore.svg';
}







}
