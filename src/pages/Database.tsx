import { APP_VERSION } from '../config';
import { useEffect, useMemo, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table';
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Columns3,
  Download,
  Filter,
  GitCompareArrows,
  Search,
  X,
  ArrowUpDown,
} from 'lucide-react';
import { useApp } from '../app/context';
import type { Material } from '../types';
import { filterMaterials, type MaterialFilters } from '../services/materials';
import { downloadCSV, materialsCSV } from '../reporting';
import { useRoute } from '../hooks/useRoute';
import { Badge, PageTitle, Unknown, Value } from '../components/UI';
import { MaterialDetail } from '../components/MaterialDetail';
const strengthFactor = 6.894757293168;
export default function Database() {
  const { dataset, comparison, toggleComparison } = useApp();
  const { params } = useRoute();
  const [filters, setFilters] = useState<MaterialFilters>(() => ({
    manufacturer: params.get('manufacturer') || '',
    family: params.get('family') || '',
    minYieldMPa: params.get('yieldMin') ? Number(params.get('yieldMin')) * strengthFactor : null,
    maxYieldMPa: params.get('yieldMax') ? Number(params.get('yieldMax')) * strengthFactor : null,
  }));
  const [sorting, setSorting] = useState<SortingState>([]);
  const [visibility, setVisibility] = useState<VisibilityState>({
    specification: false,
    uns: false,
    region: false,
  });
  const [showColumns, setShowColumns] = useState(false);
  const [moreFilters, setMoreFilters] = useState(false);
  const [selected, setSelected] = useState<Material | null>(null);
  const [minDraft, setMinDraft] = useState(params.get('yieldMin') || '');
  const [maxDraft, setMaxDraft] = useState(params.get('yieldMax') || '');
  const rangeError = [filters.minYieldMPa, filters.maxYieldMPa].some(
    (v) => v != null && (!Number.isFinite(v) || v < 0),
  )
    ? 'Yield bounds must be finite, nonnegative numbers.'
    : filters.minYieldMPa != null &&
        filters.maxYieldMPa != null &&
        filters.minYieldMPa > filters.maxYieldMPa
      ? 'The lower yield bound must not exceed the upper bound.'
      : '';
  const query = params.toString();
  useEffect(() => {
    const p = new URLSearchParams(query);
    if (p.has('manufacturer') || p.has('family') || p.has('yieldMin') || p.has('yieldMax')) {
      setMinDraft(p.get('yieldMin') || '');
      setMaxDraft(p.get('yieldMax') || '');
      setFilters({
        manufacturer: p.get('manufacturer') || '',
        family: p.get('family') || '',
        minYieldMPa: p.get('yieldMin') ? Number(p.get('yieldMin')) * strengthFactor : null,
        maxYieldMPa: p.get('yieldMax') ? Number(p.get('yieldMax')) * strengthFactor : null,
      });
    }
  }, [query]);
  const filtered = useMemo(
    () => (rangeError ? [] : filterMaterials(dataset.materials, filters)),
    [dataset, filters, rangeError],
  );
  const columns = useMemo<ColumnDef<Material>[]>(
    () => [
      {
        id: 'compare',
        header: '',
        size: 48,
        enableSorting: false,
        enableResizing: false,
        enableHiding: false,
        cell: ({ row }) => (
          <button
            className={`compare-toggle ${comparison.some((m) => m.id === row.original.id) ? 'active' : ''}`}
            onClick={() => toggleComparison(row.original)}
            aria-label={`${comparison.some((m) => m.id === row.original.id) ? 'Remove' : 'Add'} ${row.original.grade} ${comparison.some((m) => m.id === row.original.id) ? 'from' : 'to'} comparison`}
            aria-pressed={comparison.some((m) => m.id === row.original.id)}
          >
            <GitCompareArrows size={15} />
          </button>
        ),
      },
      {
        accessorKey: 'grade',
        header: 'Grade / designation',
        size: 190,
        enableHiding: false,
        cell: ({ row }) => (
          <button className="grade-link" onClick={() => setSelected(row.original)}>
            {row.original.grade}
            <span>{row.original.listingType}</span>
          </button>
        ),
      },
      { accessorKey: 'manufacturer', header: 'Manufacturer', size: 165 },
      {
        accessorKey: 'family',
        header: 'Material family',
        size: 175,
        cell: ({ getValue }) => <Badge>{getValue<string>()}</Badge>,
      },
      {
        accessorKey: 'yieldMinKsi',
        header: 'Min yield · ksi',
        size: 135,
        sortUndefined: 'last',
        cell: ({ getValue }) => (
          <span className="mono">
            <Value value={getValue<number | null>()} />
          </span>
        ),
      },
      { accessorKey: 'h2s', header: 'H₂S source designation', size: 240 },
      {
        accessorKey: 'collapse',
        header: 'Collapse',
        size: 120,
        cell: ({ getValue }) =>
          getValue() === 'enhanced' ? (
            <Badge tone="teal">Enhanced</Badge>
          ) : (
            <Unknown label="Not stated" />
          ),
      },
      {
        accessorKey: 'costTier',
        header: 'Cost tier',
        size: 165,
        cell: ({ getValue }) => <Value value={getValue<string | null>()} />,
      },
      { accessorKey: 'specification', header: 'Specification', size: 230 },
      {
        accessorKey: 'uns',
        header: 'UNS',
        size: 130,
        cell: ({ getValue }) => <Value value={getValue<string | null>()} />,
      },
      { accessorKey: 'region', header: 'Region', size: 150 },
    ],
    [comparison, toggleComparison],
  );
  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting, columnVisibility: visibility },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 20 } },
    columnResizeMode: 'onChange',
    enableMultiSort: true,
    maxMultiSortColCount: 5,
  });
  const update = <K extends keyof MaterialFilters>(key: K, value: MaterialFilters[K]) => {
    setFilters((current) => ({ ...current, [key]: value }));
    table.setPageIndex(0);
  };
  const options = (
    key: 'manufacturer' | 'family' | 'specification' | 'h2s' | 'costTier' | 'listingType',
  ) => [...new Set(dataset.materials.map((m) => m[key]).filter((v): v is string => !!v))].sort();
  const activeCount = Object.values(filters).filter(
    (v) => v !== '' && v !== null && v !== undefined,
  ).length;
  const exportMaterials = () =>
    downloadCSV(
      'octg-materials.csv',
      materialsCSV(
        table.getSortedRowModel().rows.map((r) => r.original),
        { appVersion: APP_VERSION, dataVersion: dataset.dataVersion },
      ),
    );
  return (
    <>
      <PageTitle
        eyebrow="MATERIALS / GLOBAL GRADE LIBRARY"
        title="Materials database"
        description="Search the catalogue, inspect source evidence and add grades to a comparison."
        actions={
          <button className="button secondary" onClick={exportMaterials}>
            <Download size={16} />
            Export {filtered.length} records
          </button>
        }
      />
      <div className="database-summary">
        <span>
          <strong>{dataset.materials.length}</strong> source records
        </span>
        <span>
          <strong>
            {options('manufacturer').length -
              (options('manufacturer').includes('API reference') ? 1 : 0)}
          </strong>{' '}
          manufacturer labels
        </span>
        <span>
          <strong>0</strong> independently verified
        </span>
        <Badge tone="amber">Preliminary source library</Badge>
      </div>
      <section className="panel database-panel">
        <div className="database-toolbar">
          <div className="search-field">
            <Search size={17} />
            <input
              aria-label="Search materials"
              placeholder="Search grade, manufacturer, UNS, specification…"
              value={filters.search || ''}
              onChange={(e) => update('search', e.target.value)}
            />
            {filters.search && (
              <button aria-label="Clear search" onClick={() => update('search', '')}>
                <X size={14} />
              </button>
            )}
          </div>
          <button
            className={`button secondary ${moreFilters ? 'selected' : ''}`}
            aria-expanded={moreFilters}
            onClick={() => setMoreFilters(!moreFilters)}
          >
            <Filter size={16} />
            Filters {activeCount > 0 && <span className="count-bubble">{activeCount}</span>}
          </button>
          <div className="column-picker">
            <button
              className="button secondary"
              aria-label="Columns"
              aria-expanded={showColumns}
              onClick={() => setShowColumns(!showColumns)}
            >
              <Columns3 size={16} />
              <span className="hide-small">Columns</span>
            </button>
            {showColumns && (
              <div className="popover">
                <div className="popover-title">Visible columns</div>
                {table
                  .getAllLeafColumns()
                  .filter((c) => c.getCanHide())
                  .map((c) => (
                    <label key={c.id}>
                      <input
                        type="checkbox"
                        checked={c.getIsVisible()}
                        onChange={(event) => {
                          c.getToggleVisibilityHandler()(event);
                          // Keep the mobile popover from covering sortable table headers.
                          if (window.matchMedia('(max-width: 760px)').matches) {
                            setShowColumns(false);
                          }
                        }}
                      />
                      {String(c.columnDef.header)}
                    </label>
                  ))}
              </div>
            )}
          </div>
        </div>
        <div className="quick-filters">
          <label>
            Manufacturer
            <select
              aria-label="Filter manufacturer"
              value={filters.manufacturer || ''}
              onChange={(e) => update('manufacturer', e.target.value)}
            >
              <option value="">All manufacturers</option>
              {options('manufacturer').map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
          <label>
            Material family
            <select
              aria-label="Filter material family"
              value={filters.family || ''}
              onChange={(e) => update('family', e.target.value)}
            >
              <option value="">All families</option>
              {options('family').map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
          <label>
            Collapse designation
            <select
              value={filters.collapse || ''}
              aria-label="Filter collapse designation"
              onChange={(e) => update('collapse', e.target.value)}
            >
              <option value="">Any designation</option>
              <option value="enhanced">Enhanced / high collapse</option>
              <option value="not-stated">Not stated</option>
            </select>
          </label>
          <label>
            Minimum yield range · ksi
            <div className="range-inputs">
              <input
                type="text"
                inputMode="decimal"
                aria-invalid={!!rangeError}
                aria-label="Minimum yield lower bound in ksi"
                placeholder="Min"
                value={minDraft}
                onChange={(e) => {
                  setMinDraft(e.target.value);
                  update(
                    'minYieldMPa',
                    e.target.value.trim() === ''
                      ? null
                      : /^[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?$/.test(e.target.value.trim())
                        ? Number(e.target.value) * strengthFactor
                        : NaN,
                  );
                }}
              />
              <span>–</span>
              <input
                type="text"
                inputMode="decimal"
                aria-invalid={!!rangeError}
                aria-label="Minimum yield upper bound in ksi"
                placeholder="Max"
                value={maxDraft}
                onChange={(e) => {
                  setMaxDraft(e.target.value);
                  update(
                    'maxYieldMPa',
                    e.target.value.trim() === ''
                      ? null
                      : /^[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?$/.test(e.target.value.trim())
                        ? Number(e.target.value) * strengthFactor
                        : NaN,
                  );
                }}
              />
            </div>
          </label>
        </div>
        {moreFilters && (
          <div className="quick-filters advanced-filters">
            {(['specification', 'h2s', 'costTier', 'listingType'] as const).map((key) => (
              <label key={key}>
                {
                  {
                    specification: 'Specification',
                    h2s: 'H₂S source designation',
                    costTier: 'Relative cost tier',
                    listingType: 'Listing type',
                  }[key]
                }
                <select
                  aria-label={`Filter ${key}`}
                  value={filters[key] || ''}
                  onChange={(e) => update(key, e.target.value)}
                >
                  <option value="">All values</option>
                  {options(key).map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        )}
        {rangeError && (
          <p className="inline-error" role="alert">
            {rangeError}
          </p>
        )}
        <div className="table-meta">
          <span>
            <strong>{filtered.length}</strong> matching records
            {activeCount > 0 && (
              <button
                className="text-link"
                onClick={() => {
                  setFilters({});
                  setMinDraft('');
                  setMaxDraft('');
                  table.setPageIndex(0);
                  window.history.replaceState(null, '', '#/database');
                }}
              >
                Clear filters
                <X size={12} />
              </button>
            )}
          </span>
          <span>Shift + click headers to sort multiple columns</span>
        </div>
        <div className="table-scroll">
          <table
            className="materials-table"
            style={{ width: table.getTotalSize(), minWidth: '100%' }}
          >
            <thead>
              {table.getHeaderGroups().map((group) => (
                <tr key={group.id}>
                  {group.headers.map((header) => (
                    <th
                      key={header.id}
                      style={{ width: header.getSize() }}
                      aria-sort={
                        header.column.getIsSorted() === 'asc'
                          ? 'ascending'
                          : header.column.getIsSorted() === 'desc'
                            ? 'descending'
                            : 'none'
                      }
                    >
                      {header.isPlaceholder ? null : (
                        <button
                          className="column-header"
                          onClick={header.column.getToggleSortingHandler()}
                          disabled={!header.column.getCanSort()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getCanSort() &&
                            (header.column.getIsSorted() === 'asc' ? (
                              <ArrowUp size={12} />
                            ) : header.column.getIsSorted() === 'desc' ? (
                              <ArrowDown size={12} />
                            ) : (
                              <ArrowUpDown size={11} />
                            ))}
                        </button>
                      )}
                      {header.column.getCanResize() && (
                        <div
                          role="separator"
                          aria-orientation="vertical"
                          aria-label={`Resize ${String(header.column.columnDef.header)}`}
                          className={`column-resizer ${header.column.getIsResizing() ? 'resizing' : ''}`}
                          onDoubleClick={() => header.column.resetSize()}
                          onMouseDown={header.getResizeHandler()}
                          onTouchStart={header.getResizeHandler()}
                        />
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="table-empty">
              No materials match these filters.
              <button
                className="text-link"
                onClick={() => {
                  setFilters({});
                  setMinDraft('');
                  setMaxDraft('');
                }}
              >
                Reset filters
              </button>
            </div>
          )}
        </div>
        <div className="pagination">
          <span>
            Showing{' '}
            {filtered.length
              ? table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1
              : 0}
            –
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              filtered.length,
            )}{' '}
            of {filtered.length}
            <label>
              Rows
              <select
                aria-label="Rows per page"
                value={table.getState().pagination.pageSize}
                onChange={(e) => table.setPageSize(Number(e.target.value))}
              >
                {[10, 20, 50, 100].map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </label>
          </span>
          <div>
            <button
              className="icon-button"
              aria-label="Previous page"
              disabled={!table.getCanPreviousPage()}
              onClick={() => table.previousPage()}
            >
              <ChevronLeft size={17} />
            </button>
            <span>
              Page {table.getState().pagination.pageIndex + 1} of{' '}
              {Math.max(1, table.getPageCount())}
            </span>
            <button
              className="icon-button"
              aria-label="Next page"
              disabled={!table.getCanNextPage()}
              onClick={() => table.nextPage()}
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </section>
      <p className="table-footnote">
        All source records are unverified. Yield values are source minimums; a grade name or service
        label does not establish qualification.
      </p>
      {selected && <MaterialDetail material={selected} onClose={() => setSelected(null)} />}
    </>
  );
}
