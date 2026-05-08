import { ChangeDetectorRef, Component, HostListener, Inject, ViewChild, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { IndicatorDefinitionService } from 'src/app/services/indicator-definition.service';
import { DepartmentService } from 'src/app/services/department.service';
import { IndicatorDefinition } from 'src/app/models/indicator-definition.model';
import { Department } from 'src/app/models/department.model';
import * as ExcelJS from 'exceljs';
import { lastValueFrom } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MaterialModule } from 'src/app/material.module';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';

interface DuplicateIndicator extends IndicatorDefinition {
  isDuplicate?: boolean;
  action?: 'keep_existing' | 'overwrite' | 'create_new';
  existingIndicator?: IndicatorDefinition;
}

@Component({
  selector: 'app-import-indicators',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    MatPaginatorModule
  ],
  templateUrl: './import-indicators.component.html',
  styleUrl: './import-indicators.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class ImportIndicatorsComponent {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  dataSource = new MatTableDataSource<DuplicateIndicator>([]);

  previewData: DuplicateIndicator[] = [];
  hasInvalidDepartments = false;
  hasDuplicates = false;
  displayedColumns: string[] = ['key', 'name', 'description', 'goal', 'department'];
  duplicateColumns: string[] = ['key', 'name', 'description', 'goal', 'department', 'status', 'action'];
  departments: Department[] = [];
  isDragging = false;
  uploadProgress = 0;
  globalDragging = false;
  resultsLength = 0;
  isReportMode = false;
  existingIndicators: IndicatorDefinition[] = [];

  constructor(
    private indicatorService: IndicatorDefinitionService,
    private departmentService: DepartmentService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<ImportIndicatorsComponent>,
    private cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.isReportMode = data?.isReportMode || false;
    
    this.departmentService.getAll().subscribe({
      next: (res) => this.departments = res,
      error: () => this.snackBar.open('Error al cargar departamentos', 'Cerrar', { duration: 3000, panelClass: ['snackbar-error'] })
    });
  }

  ngAfterViewInit() {
    this.cdr.detectChanges();
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
  }

  // Manejo de drag and drop (igual que antes)
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    if (event.dataTransfer?.files) {
      this.handleFiles(event.dataTransfer.files);
    }
  }

  @HostListener('document:dragover', ['$event'])
  onDocumentDragOver(event: DragEvent): void {
    if (this.isExcelFile(event)) {
      event.preventDefault();
      event.stopPropagation();
      this.globalDragging = true;
    }
  }

  @HostListener('document:dragleave', ['$event'])
  onDocumentDragLeave(event: DragEvent): void {
    this.globalDragging = false;
  }

  @HostListener('document:drop', ['$event'])
  onDocumentDrop(event: DragEvent): void {
    if (this.isExcelFile(event)) {
      event.preventDefault();
      event.stopPropagation();
      this.globalDragging = false;

      if (event.dataTransfer?.files) {
        this.handleFiles(event.dataTransfer.files);
      }
    }
  }

  private isExcelFile(event: DragEvent): boolean {
    if (!event.dataTransfer?.items) return false;

    for (let i = 0; i < event.dataTransfer.items.length; i++) {
      const item = event.dataTransfer.items[i];
      if (item.kind === 'file' && item.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        return true;
      }
    }
    return false;
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.handleFiles(input.files);
  }

  private async handleFiles(files: FileList): Promise<void> {
    const file = files[0];
    if (!file.name.endsWith('.xlsx')) {
      this.snackBar.open('Solo se aceptan archivos .xlsx', 'Cerrar', { duration: 3000, panelClass: ['snackbar-error'] });
      return;
    }

    try {
      const workbook = new ExcelJS.Workbook();
      const buffer = await file.arrayBuffer();
      await workbook.xlsx.load(buffer);
      await this.processWorkbook(workbook);
    } catch (error) {
      this.snackBar.open('Error al leer el archivo Excel', 'Cerrar', { duration: 3000, panelClass: ['snackbar-error'] });
    }
  }

  private async processWorkbook(workbook: ExcelJS.Workbook): Promise<void> {
    const worksheet = workbook.worksheets[0];
    const data: DuplicateIndicator[] = [];
    this.hasInvalidDepartments = false;

    // Procesar el Excel
    worksheet.eachRow((row, rowIndex) => {
      if (rowIndex === 1) return;

      const values = Array.isArray(row.values) ? row.values : Object.values(row.values);
      const [key, name, description, goal, departmentNamesStr] = values.slice(1);

      // Procesar departamentos
      const departmentNames = (departmentNamesStr?.toString() || '').split(',').map(n => n.trim());
      const departments: Department[] = [];

      departmentNames.forEach(name => {
        const foundDept = this.findDepartmentByName(name);
        if (foundDept) {
          departments.push(foundDept);
        } else {
          departments.push({
            _id: '',
            name: name,
            shortName: 'Inválido',
            isInvalid: true
          });
          this.hasInvalidDepartments = true;
        }
      });

      const parsedGoal = Number(goal);

      data.push({
        key: key?.toString() || '',
        name: name?.toString() || '',
        description: description?.toString() || '',
        goal: isNaN(parsedGoal) ? 0 : parsedGoal,
        departments: departments.length > 0 ? departments : [{
          _id: '',
          name: 'Sin departamentos especificados',
          shortName: 'Inválido',
          isInvalid: true
        }],
        action: 'create_new'
      });
    });

    // Verificar duplicados si estamos en modo reporte
    if (this.isReportMode) {
      await this.checkForDuplicates(data);
    }

    this.previewData = data;
    this.dataSource = new MatTableDataSource(this.previewData);
    this.resultsLength = this.dataSource.data.length;
    
    // Actualizar columnas mostradas
    this.displayedColumns = this.hasDuplicates ? this.duplicateColumns : ['key', 'name', 'description', 'goal', 'department'];
    
    this.cdr.detectChanges();

    setTimeout(() => {
      if (this.paginator) {
        this.dataSource.paginator = this.paginator;
      }
    });

    if (this.hasInvalidDepartments) {
      this.snackBar.open(
        'Se encontraron departamentos con nombres inválidos. Estos se mostrarán en rojo.',
        'Cerrar',
        { duration: 5000, panelClass: ['snackbar-error'] }
      );
    }

    if (this.hasDuplicates) {
      this.snackBar.open(
        'Se encontraron indicadores duplicados. Revisa las acciones sugeridas.',
        'Cerrar',
        { duration: 5000, panelClass: ['snackbar-warning'] }
      );
    }
  }

  private async checkForDuplicates(data: DuplicateIndicator[]): Promise<void> {
    const keys = data.map(item => item.key);
    
    try {
      // Verificar qué indicadores ya existen
      const existingResponse = await lastValueFrom(
        this.indicatorService.checkExistingKeys(keys)
      );
      
      this.existingIndicators = existingResponse || [];
      const existingKeys = this.existingIndicators.map(ind => ind.key);

      // Marcar duplicados y asignar acciones por defecto
      data.forEach(item => {
        const existingIndicator = this.existingIndicators.find(ex => ex.key === item.key);
        if (existingIndicator) {
          item.isDuplicate = true;
          item.existingIndicator = existingIndicator;
          item.action = 'keep_existing'; // Por defecto, mantener existente
          this.hasDuplicates = true;
        }
      });

    } catch (error) {
      console.error('Error verificando duplicados:', error);
    }
  }

  // Cambiar acción para un indicador duplicado
  onActionChange(indicator: DuplicateIndicator, action: 'keep_existing' | 'overwrite' | 'create_new'): void {
    indicator.action = action;
  }

  findDepartmentByName(name: string): Department | undefined {
    const normalized = this.normalizeString(name);
    return this.departments.find(d => this.normalizeString(d.name) === normalized);
  }

  normalizeString(str: string): string {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  async processIndicators(): Promise<void> {
    if (this.previewData.length === 0) return;

    if (this.isReportMode) {
      // En modo reporte, solo devolver los datos sin procesar
      this.dialogRef.close({ 
        indicators: this.previewData // Devolver datos sin procesar con metadata de duplicados
      });
      return;
    }

    // Modo normal: procesar e insertar en BD inmediatamente
    const toCreate: DuplicateIndicator[] = [];
    const toUpdate: DuplicateIndicator[] = [];

    this.previewData.forEach(indicator => {
      if (indicator.isDuplicate) {
        switch (indicator.action) {
          case 'overwrite':
            toUpdate.push(indicator);
            break;
          case 'create_new':
            // Generar nueva clave única
            indicator.key = `${indicator.key}_${Date.now()}`;
            toCreate.push(indicator);
            break;
          // keep_existing no requiere acción
        }
      } else {
        toCreate.push(indicator);
      }
    });

    try {
      this.uploadProgress = 10;

      // Crear nuevos indicadores
      if (toCreate.length > 0) {
        const payload = toCreate.map(indicator => ({
          ...indicator,
          departments: indicator.departments.map(dep => dep._id) as any,
        }));

        await lastValueFrom(this.indicatorService.bulkCreate(payload));
        this.uploadProgress = 50;
      }

      // Actualizar indicadores existentes
      if (toUpdate.length > 0) {
        for (const indicator of toUpdate) {
          if (indicator.existingIndicator?._id) {
            await lastValueFrom(
              this.indicatorService.update(indicator.existingIndicator._id, {
                ...indicator,
                departments: indicator.departments.map(dep => dep._id) as any,
              })
            );
          }
        }
        this.uploadProgress = 80;
      }

      this.uploadProgress = 100;

      this.snackBar.open('Indicadores importados con éxito', 'Cerrar', { 
        duration: 3000, 
        panelClass: ['snackbar-success'] 
      });
      this.dialogRef.close(true);

    } catch (error: any) {
      let errorMessage = 'Error al procesar los indicadores';
      if (error.error?.error) {
        errorMessage = error.error.error;
      }
      this.snackBar.open(errorMessage, 'Cerrar', {
        duration: 20000,
        panelClass: ['snackbar-error']
      });
    }
  }

  closeDialog(): void {
    this.dialogRef.close(false);
  }

  // Método para aplicar acción a todos los duplicados
  applyActionToAll(action: 'keep_existing' | 'overwrite' | 'create_new'): void {
    this.previewData.forEach(indicator => {
      if (indicator.isDuplicate) {
        indicator.action = action;
      }
    });
  }

  // Obtener texto de estado para mostrar en la tabla
  getStatusText(indicator: DuplicateIndicator): string {
    if (!indicator.isDuplicate) {
      return 'Nuevo';
    }
    
    switch (indicator.action) {
      case 'keep_existing':
        return 'Mantener existente';
      case 'overwrite':
        return 'Sobrescribir';
      case 'create_new':
        return 'Crear con nueva clave';
      default:
        return 'Duplicado';
    }
  }

  // Obtener clase CSS para el estado
  getStatusClass(indicator: DuplicateIndicator): string {
    if (!indicator.isDuplicate) {
      return 'status-new';
    }
    
    switch (indicator.action) {
      case 'keep_existing':
        return 'status-keep';
      case 'overwrite':
        return 'status-overwrite';
      case 'create_new':
        return 'status-create';
      default:
        return 'status-duplicate';
    }
  }
}