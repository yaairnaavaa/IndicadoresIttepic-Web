import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IndicatorDefinition } from 'src/app/models/indicator-definition.model';
import { Department } from 'src/app/models/department.model';
import { DepartmentService } from 'src/app/services/department.service';
import { IndicatorDefinitionService } from 'src/app/services/indicator-definition.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MaterialModule } from 'src/app/material.module';
import { CommonModule, NgIf } from '@angular/common';
import { MAT_DATE_LOCALE, MatOptionModule, provideNativeDateAdapter } from '@angular/material/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs/operators';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatOptionModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatSelectModule,
    MatButtonModule,
    ReactiveFormsModule,
    MaterialModule,
    NgIf
  ],
  providers: [provideNativeDateAdapter(), { provide: MAT_DATE_LOCALE, useValue: 'es-MX' }],
  selector: 'app-edit-indicator-dialog',
  templateUrl: './edit-indicator-dialog.component.html',
})
export class EditIndicatorDialogComponent {
  editForm: FormGroup;
  departments: Department[] = [];
  filteredDepartments: Department[] = [];
  isLoading = false;
  isSaving = false;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<EditIndicatorDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { indicator: IndicatorDefinition },
    private departmentService: DepartmentService,
    private indicatorService: IndicatorDefinitionService,
    private snackBar: MatSnackBar
  ) {

    this.editForm = this.fb.group({
      key: [data.indicator.key, [Validators.required]],
      name: [data.indicator.name, Validators.required],
      description: [data.indicator.description || ''],
      goal: [data.indicator.goal, [Validators.required, Validators.min(0)]],
      departments: [data.indicator.departments || [], Validators.required],
    });

    this.loadDepartments();

  }

  loadDepartments(): void {
    this.isLoading = true;
    this.departmentService.getAll().pipe(
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: (departments) => {
        this.departments = departments;
        this.filteredDepartments = departments;

        const selectedDepartments = this.data.indicator.departments?.map(selected =>
          departments.find(d => d._id === selected._id)
        ).filter(d => !!d); 

        this.editForm.get('departments')?.setValue(selectedDepartments || []);
      },
      error: () => {
        this.snackBar.open('Error al cargar departamentos', 'Cerrar', { 
          duration: 3000, 
          panelClass: ['snackbar-error'] 
        });
      }
    });
  }

  filterDepartments(value: string): Department[] {
    const filterValue = value.toLowerCase();
    return this.departments.filter(dept => dept.name.toLowerCase().includes(filterValue));
  }

  onDepartmentSelected(name: string): void {
    const selected = this.departments.find(d => d.name === name);
    if (selected) {
      this.editForm.get('department')?.setValue(selected._id);
    }
  }

  onSave(): void {
    if (this.editForm.invalid) return;

    this.isSaving = true;

    const formValue = this.editForm.value;
    const updatedIndicator: IndicatorDefinition = {
      ...this.data.indicator,
      key: formValue.key,
      name: formValue.name,
      description: formValue.description,
      goal: formValue.goal,
      departments: formValue.departments
    };

    this.indicatorService.update(this.data.indicator._id!, updatedIndicator).subscribe({
      next: (result) => {
        this.isSaving = false;
        this.snackBar.open('Indicador actualizado con éxito', 'Cerrar', { 
          duration: 3000, 
          panelClass: ['snackbar-success'] 
        });
        this.dialogRef.close(result);
      },
      error: (error: HttpErrorResponse) => {
        this.isSaving = false;
        
        if (error.status === 409) {
          // Error de clave duplicada
          const errorResponse = error.error;
          this.snackBar.open(
            `Error: La clave "${errorResponse.duplicateKey}" ya existe en otro indicador`, 
            'Cerrar', 
            { 
              duration: 5000,
              panelClass: ['snackbar-error'] 
            }
          );
          
          // Marcar el campo de clave como inválido
          this.editForm.get('key')?.setErrors({ duplicate: true });
        } else if (error.status === 400) {
          // Error de validación
          this.snackBar.open(
            'Error: Datos de entrada inválidos. Por favor, verifica la información.', 
            'Cerrar', 
            { 
              duration: 4000,
              panelClass: ['snackbar-error'] 
            }
          );
        } else if (error.status === 404) {
          // Indicador no encontrado
          this.snackBar.open(
            'Error: El indicador no fue encontrado', 
            'Cerrar', 
            { 
              duration: 4000,
              panelClass: ['snackbar-error'] 
            }
          );
          this.dialogRef.close();
        } else {
          // Error genérico del servidor
          this.snackBar.open(
            'Error inesperado al actualizar el indicador', 
            'Cerrar', 
            { 
              duration: 3000, 
              panelClass: ['snackbar-error'] 
            }
          );
        }
        
        // console.error('Error al actualizar indicador:', error);
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  // Método para verificar si la clave ha cambiado
  hasKeyChanged(): boolean {
    return this.editForm.get('key')?.value !== this.data.indicator.key;
  }

  // Opcional: Validación en tiempo real para clave duplicada
  onKeyChange(): void {
    if (this.hasKeyChanged()) {
      // Limpiar error de duplicado cuando el usuario modifica la clave
      this.editForm.get('key')?.setErrors({ duplicate: null });
      this.editForm.get('key')?.updateValueAndValidity();
    }
  }
}