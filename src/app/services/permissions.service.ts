import { Injectable } from '@angular/core';
import { NavItem } from '../layouts/full/sidebar/nav-item/nav-item';

@Injectable({ providedIn: 'root' })
export class PermissionsService {
  private navItems: NavItem[] = [];

  setNavItemsFromPermissions(permissions: any[]) {
    const items: NavItem[] = [];

    const grouped = this.groupPermissions(permissions);
    // Indicadores
    if (grouped['Indicadores']) {
      items.push({ navCap: 'Indicadores', divider: true });
      items.push(...grouped['Indicadores']);
    }

    // Reportes
    if (grouped['Reportes']) {
      items.push({ navCap: 'Reportes', divider: false });
      items.push(...grouped['Reportes']);
    }

    // Captura de datos
    if (grouped['Captura de datos']) {
      items.push({ navCap: 'Captura de datos', divider: true });
      items.push(...grouped['Captura de datos']);
    }

    // Seguimiento
    if (grouped['Seguimiento']) {
      items.push({ navCap: 'Seguimiento', divider: true });
      items.push(...grouped['Seguimiento']);
    }

    this.navItems = items;
    localStorage.setItem('navItems', JSON.stringify(items)); // opcional
  }

  getNavItems(): NavItem[] {
    if (this.navItems.length === 0) {
      const stored = localStorage.getItem('navItems');
      if (stored) this.navItems = JSON.parse(stored);
    }
    return this.navItems;
  }

  private groupPermissions(permissions: any[]): Record<string, NavItem[]> {
    const grouped: Record<string, NavItem[]> = {};

    for (const perm of permissions) {
      let category = '';
      if (perm.route.startsWith('/reportes')) category = 'Reportes';
      else if (perm.route.startsWith('/indicadores')) category = 'Indicadores';
      else if (perm.route.startsWith('/captura')) category = 'Captura de datos';
      else if (perm.route.startsWith('/estadisticas')) category = 'Seguimiento';

      if (!grouped[category]) grouped[category] = [];
      grouped[category].push({
        displayName: perm.displayName,
        iconName: perm.iconName,
        route: perm.route,
      });
    }

    return grouped;
  }
}
