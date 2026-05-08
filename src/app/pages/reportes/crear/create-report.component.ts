import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { IndicatorDefinitionService } from 'src/app/services/indicator-definition.service';
import { IndicatorDefinition } from 'src/app/models/indicator-definition.model';
import { ReportService } from 'src/app/services/report.service';
import { Report } from 'src/app/models/report.model';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/material.module';
import { Router } from '@angular/router';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { trigger, transition, style, animate } from '@angular/animations';
import { MatDialog } from '@angular/material/dialog';
import { lastValueFrom } from 'rxjs';
import { TruncatePipe } from 'src/app/pipe/truncate.pipe';

import { IndicatorTableComponent } from 'src/app/components/indicadores/indicators-table/indicators-table.component';
import { ImportIndicatorsComponent } from 'src/app/components/indicadores/import-indicators/import-indicators.component';

@Component({
  selector: 'app-create-report-component',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MaterialModule,
    MatSnackBarModule,
    MatDatepickerModule,
    TruncatePipe,
    IndicatorTableComponent
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
    ]),
    trigger('fadeSlide', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ opacity: 0, transform: 'translateX(20px)' }))
      ])
    ])
  ],
  providers: [provideNativeDateAdapter(), { provide: MAT_DATE_LOCALE, useValue: 'es-MX' }],
  styleUrl: './create-report.component.scss',
  templateUrl: './create-report.component.html',
})
export class CreateReportComponent implements OnInit {
  @ViewChild(IndicatorTableComponent) indicatorTable!: IndicatorTableComponent;
  form: FormGroup;
  indicatorDefinitions: IndicatorDefinition[] = [];
  importedIndicators: IndicatorDefinition[] = []; // Nuevos indicadores importados
  isLoading = true;
  hasImportedData = false; // Flag para saber si se importaron indicadores
  hasDuplicates = false; // Flag para saber si hay duplicados entre los importados

  selectedIndicators: IndicatorDefinition[] = [];

  displayedColumns: string[] = ['select', 'key', 'name', 'departments', 'goal'];

  reportNameOptions: string[] = [
    'Indicadores Básicos',
    'Cuestionarios 911',
    'Avance de Indicadores del PTA',
    'Informe de Rendición de Cuentas',
    'Informe de Rendición de Cuentas Sexenal',
    'Otro (ingrese el nombre manualmente)'
  ];

  constructor(
    private fb: FormBuilder,
    private indicatorService: IndicatorDefinitionService,
    private reportService: ReportService,
    private snackBar: MatSnackBar,
    private router: Router,
    private dialog: MatDialog
  ) {
    this.form = this.fb.group({
      reportNameSelect: ['', Validators.required],
      customReportName: [''],
      name: ['', Validators.required],
      description: [''],
      indicatorDefinitions: [[], Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadIndicatorDefinitions();

    this.form.get('reportNameSelect')?.valueChanges.subscribe(value => {
      if (value.startsWith('Otro')) {
        this.form.get('customReportName')?.setValidators(Validators.required);
      } else {
        this.form.get('customReportName')?.clearValidators();
        this.form.get('customReportName')?.setValue('');
        this.form.get('name')?.setValue(value);
      }
      this.form.get('customReportName')?.updateValueAndValidity();
    });

    this.form.get('customReportName')?.valueChanges.subscribe(value => {
      if (this.form.get('reportNameSelect')?.value?.startsWith('Otro')) {
        this.form.get('name')?.setValue(value);
      }
    });
  }

  loadIndicatorDefinitions(): void {
    this.indicatorService.getAll().subscribe({
      next: (indicators) => {
        this.indicatorDefinitions = indicators;
        this.isLoading = false;
      },
      error: () => {
        this.snackBar.open('Error al cargar indicadores', 'Cerrar', {
          duration: 3000,
          panelClass: ['snackbar-error']
        });
        this.isLoading = false;
      }
    });
  }

  // Obtener los indicadores a mostrar en la tabla (importados o todos)
  getDisplayedIndicators(): IndicatorDefinition[] {
    return this.hasImportedData ? this.importedIndicators : this.indicatorDefinitions;
  }

  onIndicatorsSelected(indicators: IndicatorDefinition[]): void {
    this.selectedIndicators = indicators;
    this.form.get('indicatorDefinitions')?.setValue(this.selectedIndicators.map(i => i._id));
  }

  removeSelected(indicator: IndicatorDefinition): void {
    this.selectedIndicators = this.selectedIndicators.filter(i => i._id !== indicator._id);
    this.form.get('indicatorDefinitions')?.setValue(this.selectedIndicators.map(i => i._id));

    if (this.indicatorTable) {
      this.indicatorTable.toggleSelection(indicator);
    }
  }

  async onSubmit() {
    if (this.form.invalid) return;

    try {
      let indicatorIds: string[] = [];

      // Si hay indicadores importados, procesarlos primero
      if (this.hasImportedData && this.importedIndicators.length > 0) {
        const selectedImported = this.selectedIndicators.filter(selected => 
          this.importedIndicators.some(imported => imported.key === selected.key)
        );

        if (selectedImported.length > 0) {
          // Procesar indicadores importados según sus acciones
          const processedIndicators = await this.processImportedIndicators(selectedImported);
          indicatorIds = processedIndicators.map(ind => ind._id!);
        }
      } else {
        // Usar indicadores seleccionados normalmente
        indicatorIds = this.form.get('indicatorDefinitions')?.value || [];
      }

      // Crear el reporte con los IDs finales
      const { indicatorDefinitions, ...rest } = this.form.value;
      const newReport: Report = {
        ...rest,
        indicators: indicatorIds
      };

      this.reportService.create(newReport).subscribe({
        next: () => {
          this.snackBar.open('Reporte creado con éxito', 'Cerrar', {
            duration: 3000,
            panelClass: ['snackbar-success']
          });
          this.router.navigate(['reportes/ver']);
        },
        error: () => {
          this.snackBar.open('Ocurrió un error al crear el reporte', 'Cerrar', {
            duration: 3000,
            panelClass: ['snackbar-error']
          });
        }
      });

    } catch (error) {
      this.snackBar.open('Error al procesar indicadores importados', 'Cerrar', {
        duration: 3000,
        panelClass: ['snackbar-error']
      });
    }
  }

  openImportDialog(): void {
    const dialogRef = this.dialog.open(ImportIndicatorsComponent, {
      width: '80vw',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: { isReportMode: true } // Indicar que estamos en modo reporte
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.indicators) {
        // Recibir los indicadores SIN PROCESAR del diálogo
        this.importedIndicators = result.indicators;
        this.hasImportedData = true;
        
        // Limpiar selecciones previas
        this.selectedIndicators = [];
        this.selectedIndicators = this.importedIndicators;
        this.form.get('indicatorDefinitions')?.setValue([]);

        const duplicateCount = result.indicators.filter((ind: any) => ind.isDuplicate).length;
        this.hasDuplicates = duplicateCount > 0;
        const newCount = result.indicators.length - duplicateCount;

        this.snackBar.open(
          `${result.indicators.length} indicadores preparados (${newCount} nuevos, ${duplicateCount} duplicados). Se procesarán al crear el reporte.`,
          'Cerrar',
          { 
            duration: 5000, 
            panelClass: ['snackbar-info'] 
          }
        );
      }
    });
  }

  // Método para procesar indicadores importados al crear el reporte
  private async processImportedIndicators(selectedImported: IndicatorDefinition[]): Promise<IndicatorDefinition[]> {
    const toCreate: any[] = [];
    const toUpdate: any[] = [];
    const toKeep: IndicatorDefinition[] = [];
    const processedIndicators: IndicatorDefinition[] = [];

    for (const indicator of selectedImported) {
      const duplicateIndicator = indicator as any; // Cast para acceder a propiedades de duplicado

      if (duplicateIndicator.isDuplicate) {
        switch (duplicateIndicator.action) {
          case 'keep_existing':
            if (duplicateIndicator.existingIndicator) {
              processedIndicators.push(duplicateIndicator.existingIndicator);
            }
            break;
          case 'overwrite':
            toUpdate.push({
              id: duplicateIndicator.existingIndicator._id,
              data: {
                ...indicator,
                departments: indicator.departments.map(dep => dep._id)
              }
            });
            break;
          case 'create_new':
            // Generar nueva clave única
            const newIndicator = {
              ...indicator,
              key: `${indicator.key}_${Date.now()}`,
              departments: indicator.departments.map(dep => dep._id)
            };
            toCreate.push(newIndicator);
            break;
        }
      } else {
        // Indicador nuevo, agregar a crear
        toCreate.push({
          ...indicator,
          departments: indicator.departments.map(dep => dep._id)
        });
      }
    }

    // Ejecutar operaciones en la BD
    
    // Crear nuevos indicadores
    if (toCreate.length > 0) {
      const created = await lastValueFrom(this.indicatorService.bulkCreate(toCreate));
      processedIndicators.push(...created);
    }

    // Actualizar indicadores existentes
    for (const updateItem of toUpdate) {
      const updated = await lastValueFrom(
        this.indicatorService.update(updateItem.id, updateItem.data)
      );
      processedIndicators.push(updated);
    }

    return processedIndicators;
  }

}