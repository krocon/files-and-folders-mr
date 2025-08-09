import type {ThemeTableRow} from './theme-table-row.model';
import {themeTableRowComparator} from './theme-table-row.model';

describe('themeTableRowComparator', () => {
  const rows: ThemeTableRow[] = [
    {selected: true, key: 'z-key', value: '#aaaaaa'},
    {selected: false, key: 'a-key', value: '#ffffff'},
    {selected: true, key: 'm-key', value: '#000000'},
    {selected: false, key: 'b-key', value: '#cccccc'},
  ];

  it('sorts by key ascending', () => {
    const sorted = [...rows].sort(themeTableRowComparator('key', 'asc'));
    expect(sorted.map(r => r.key)).toEqual(['a-key', 'b-key', 'm-key', 'z-key']);
  });

  it('sorts by key descending', () => {
    const sorted = [...rows].sort(themeTableRowComparator('key', 'desc'));
    expect(sorted.map(r => r.key)).toEqual(['z-key', 'm-key', 'b-key', 'a-key']);
  });

  it('sorts by selected ascending (false first)', () => {
    const sorted = [...rows].sort(themeTableRowComparator('selected', 'asc'));
    expect(sorted.map(r => r.selected)).toEqual([false, false, true, true]);
  });

  it('sorts by selected descending (true first)', () => {
    const sorted = [...rows].sort(themeTableRowComparator('selected', 'desc'));
    expect(sorted.map(r => r.selected)).toEqual([true, true, false, false]);
  });

  it('sorts by value ascending lexicographically (case-insensitive)', () => {
    const sorted = [...rows].sort(themeTableRowComparator('value', 'asc'));
    expect(sorted.map(r => r.value)).toEqual(['#000000', '#aaaaaa', '#cccccc', '#ffffff']);
  });
});
