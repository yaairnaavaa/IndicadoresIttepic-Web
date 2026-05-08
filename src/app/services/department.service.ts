import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, of } from "rxjs";  
import { tap } from "rxjs/operators";   
import { Department } from "../models/department.model";
import { environment } from "src/environments/environment";

@Injectable({ providedIn: 'root' })
export class DepartmentService {
  private apiUrl = `${environment.apiUrl}/departments`;
  private cache: Department[] | null = null;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Department[]> {
    if (this.cache) {
      return of(this.cache);
    }

    return this.http.get<Department[]>(`${this.apiUrl}/all`,{ withCredentials: true }).pipe(
      tap(data => this.cache = data) 
    );
  }
}
