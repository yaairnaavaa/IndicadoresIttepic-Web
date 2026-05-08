import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "src/environments/environment";

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  getEmployeeData(email: string) {
    return this.http.get(`${this.apiUrl}/employee/${email}`, {
      withCredentials: true
    });
  }

  setEmployeeRole(role: string){
    localStorage.setItem('employeeRole', role);
  }

  setEmployeeDepartment(department: string){
    localStorage.setItem('employeeDepartment', department);
  }

  setEmployeeDepartmentId(departmentId: string){
    localStorage.setItem('employeeDepartmentId', departmentId);
  }

  getEmployeeRole(){
    return localStorage.getItem('employeeRole') ??'';
  }
  getEmployeeDepartment(){
    return localStorage.getItem('employeeDepartment')??'';
  }
  getEmployeeDepartmentId(){
    return localStorage.getItem('employeeDepartmentId')??'';
  }
}
