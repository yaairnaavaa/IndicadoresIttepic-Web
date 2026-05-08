import { Employee } from "./employee.model";

export interface User {
  _id: string;
  email: string;
  employeeId: Employee;
}
