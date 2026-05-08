export interface DepartmentCaptureProgress {
  departmentId: string;
  departmentName: string;
  departmentShortName: string;
  percentage: number;
  pending: number;
}

export interface CaptureProgressResponse {
  total: number;
  byDepartments: DepartmentCaptureProgress[];
}
