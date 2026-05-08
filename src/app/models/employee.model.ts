export interface Name {
  firstName: string;
  lastName: string;
  fullName: string;
}
export interface Grade {
  abbreviation: string;
}
export interface Employee {
  _id: string;
  name: Name
  grade: Grade;
}