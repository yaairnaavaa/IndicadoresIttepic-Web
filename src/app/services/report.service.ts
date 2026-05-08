import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Report } from '../models/report.model';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private apiUrl = `${environment.apiUrl}/reports`;

  constructor(private http: HttpClient) {}

  create(data: Report): Observable<Report> {
    return this.http.post<Report>(`${this.apiUrl}/`, data, { withCredentials: true });
  }
  getAll(): Observable<Report[]> {
    return this.http.get<Report[]>(`${this.apiUrl}/all`, { withCredentials: true });
  }
  getById(id: string): Observable<Report> {
    return this.http.get<Report>(`${this.apiUrl}/${id}`, { withCredentials: true });
  }
  update(id: string, data: Partial<Report>): Observable<Report> {
    return this.http.put<Report>(`${this.apiUrl}/${id}`, data, { withCredentials: true });
  }
}
