import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { IndicatorDefinitionService } from 'src/app/services/indicator-definition.service';
import { IndicatorDefinition } from 'src/app/models/indicator-definition.model';
import { Department } from 'src/app/models/department.model';
import { DepartmentService } from 'src/app/services/department.service';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/material.module';
import { Router } from '@angular/router';
import { startWith, map } from 'rxjs';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { trigger, transition, style, animate } from '@angular/animations';
import { MatDialog } from '@angular/material/dialog';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-create-component',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MaterialModule,
    MatSnackBarModule,
    MatDatepickerModule
  ],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-out', style({ opacity: 1 })),
      ]),
      transition(':leave', [
        animate('200ms ease-out', style({ opacity: 0 })),
      ]),
    ])
  ],
  providers: [provideNativeDateAdapter(), { provide: MAT_DATE_LOCALE, useValue: 'es-MX' }],
  templateUrl: './create.component.html',
})
export class CreateComponent implements OnInit {
  form: FormGroup;
  departments: Department[] = [];

  constructor(
    private fb: FormBuilder,
    private indicatorService: IndicatorDefinitionService,
    private departmentService: DepartmentService,
    private snackBar: MatSnackBar,
    private router: Router,
    private dialog: MatDialog
  ) {
    this.form = this.fb.group({
      key: ['', [Validators.required]],
      name: ['', Validators.required],
      description: [''],
      goal: [0, [Validators.required, Validators.min(0)]],
      departments: [[], Validators.required]
    });

  }

  ngOnInit(): void {
    this.loadDepartments();
  }

  loadDepartments(): void {
    this.departmentService.getAll().subscribe({
      next: (departments) => {
        this.departments = departments;
      },
      error: () => {
        this.snackBar.open('Error al cargar departamentos', 'Cerrar', { duration: 3000, panelClass: ['snackbar-error'] });
      }
    });
  }

  onDepartmentSelected(name: string) {
    const selected = this.departments.find(d => d.name === name);
    if (selected) {
      this.form.get('department')?.setValue(selected._id);
    }
  }

  onSubmit() {
    if (this.form.invalid) return;

    const { departments, ...rest } = this.form.value;

    const newDefinition: IndicatorDefinition = {
      ...rest,
      departments: departments
    };

    this.indicatorService.create(newDefinition).subscribe({
      next: () => {
        this.snackBar.open('Indicador creado con éxito', 'Cerrar', {
          duration: 3000,
          panelClass: ['snackbar-success']
        });
        this.form.reset();
        this.router.navigate(['/indicadores/ver']);
      },
      error: (error: HttpErrorResponse) => {

        if (error.status === 409) {
          // Error de clave duplicada
          const errorResponse = error.error;
          this.snackBar.open(
            `Error: La clave "${errorResponse.duplicateKey}" ya existe en el sistema`,
            'Cerrar',
            {
              duration: 5000, // Más tiempo para leer el mensaje
              panelClass: ['snackbar-error']
            }
          );

          // Opcional: resaltar el campo de clave
          this.form.get('key')?.setErrors({ duplicate: true });
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
        } else {
          // Error genérico del servidor
          this.snackBar.open(
            'Error inesperado al crear el indicador',
            'Cerrar',
            {
              duration: 3000,
              panelClass: ['snackbar-error']
            }
          );
        }

        console.error('Error al crear indicador:', error);
      }
    });
  }

}

