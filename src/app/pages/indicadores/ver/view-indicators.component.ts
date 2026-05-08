import { Component } from '@angular/core';
import { IndicatorDefinitionService } from 'src/app/services/indicator-definition.service';
import { IndicatorDefinition } from 'src/app/models/indicator-definition.model';
import { MaterialModule } from 'src/app/material.module';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { trigger, transition, animate, style } from '@angular/animations';
import { MatDialog } from '@angular/material/dialog';
import { EditIndicatorDialogComponent } from '../editar/edit-indicator-dialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { IndicatorTableComponent } from 'src/app/components/indicadores/indicators-table/indicators-table.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-view-indicators-component',
  standalone: true,
  imports: [MaterialModule, CommonModule, FormsModule, ReactiveFormsModule, IndicatorTableComponent],
  templateUrl: './view-indicators.component.html',
  styleUrl: './view-indicators.component.scss',
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
})
export class ViewIndicatorsComponent {
  isLoading = true;
  displayedColumns: string[] = ['index', 'key', 'name', 'description', 'goal', 'departments', 'actions'];

  indicators: IndicatorDefinition[];

  constructor(
    private indicatorService: IndicatorDefinitionService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadIndicators();
  }

  editIndicator(indicator: IndicatorDefinition): void {
    window.scrollTo({ top: 0 });
    const dialogRef = this.dialog.open(EditIndicatorDialogComponent, {
      width: '600px',
      data: { indicator },
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe(updatedIndicator => {
      if (updatedIndicator) {
        this.indicatorService.update(updatedIndicator._id, updatedIndicator).subscribe({
          next: () => {
            this.loadIndicators();
            this.snackBar.open('Indicador actualizado con éxito', 'Cerrar', {
              duration: 3000,
              panelClass: ['snackbar-success']
            });
          },
          error: () => {
            this.snackBar.open('Error al actualizar el indicador', 'Cerrar', {
              duration: 3000,
              panelClass: ['snackbar-error']
            });
          }
        });
      }
    });
  }

  navigateToCreate(): void {
    this.router.navigate(['/indicadores/crear']);
  }

  private loadIndicators(): void {
    this.indicatorService.getAll().subscribe({
      next: (data) => {
        const dataConIndice = data.map((item, idx) => ({
          ...item,
          index: idx + 1,
        }));

        this.indicators = dataConIndice;
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
      }
    });
  }


}