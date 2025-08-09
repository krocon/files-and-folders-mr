export interface ThemeTableRow {
  selected: boolean;
  key: string;
  value: string;
}

export type ThemeTableColumn = 'selected' | 'key' | 'value';
export type SortDirection = 'asc' | 'desc';

/**
 * Returns a comparator function for ThemeTableRow sorting by the specified column and direction.
 * - selected: false < true when ascending
 * - key/value: case-insensitive string compare, with key used as stable tie-breaker
 */
export function themeTableRowComparator(column: ThemeTableColumn, direction: SortDirection = 'asc') {
  const dir = direction === 'asc' ? 1 : -1;

  const cmp = (x: number | string, y: number | string) => {
    if (x < y) return -1 * dir;
    if (x > y) return 1 * dir;
    return 0;
  };

  return (a: ThemeTableRow, b: ThemeTableRow) => {
    switch (column) {
      case 'selected': {
        const av = a.selected ? 1 : 0;
        const bv = b.selected ? 1 : 0;
        const c = cmp(av, bv);
        if (c !== 0) return c;
        // tie-breakers
        const ck = cmp(a.key.toLowerCase(), b.key.toLowerCase());
        if (ck !== 0) return ck;
        return cmp(a.value.toLowerCase(), b.value.toLowerCase());
      }
      case 'key': {
        const c = cmp(a.key.toLowerCase(), b.key.toLowerCase());
        if (c !== 0) return c;
        // tie-breakers
        const cs = cmp(a.selected ? 1 : 0, b.selected ? 1 : 0);
        if (cs !== 0) return cs;
        return cmp(a.value.toLowerCase(), b.value.toLowerCase());
      }
      case 'value':
      default: {
        const c = cmp(a.value.toLowerCase(), b.value.toLowerCase());
        if (c !== 0) return c;
        // tie-breakers
        const ck = cmp(a.key.toLowerCase(), b.key.toLowerCase());
        if (ck !== 0) return ck;
        return cmp(a.selected ? 1 : 0, b.selected ? 1 : 0);
      }
    }
  };
}

