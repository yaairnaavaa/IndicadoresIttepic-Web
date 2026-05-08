import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private userSubject = new BehaviorSubject<any>(this.getUserFromStorage());
  currentUser$ = this.userSubject.asObservable();

  private getUserFromStorage(): any {
    const userData = localStorage.getItem('userData'); 
    return userData ? JSON.parse(userData) : null;
  }

  setUser(user: any): void {
    localStorage.setItem('userData', JSON.stringify(user));
    this.userSubject.next(user);
  }

  getUser(): any {
    return this.userSubject.value;
  }

  clearUser(): void {
    localStorage.removeItem('userData');
    this.userSubject.next(null);
  }
}