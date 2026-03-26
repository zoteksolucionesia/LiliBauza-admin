"use client";

import { colors } from "@/lib/theme";

interface Column {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  onRowClick?: (row: any) => void;
  actions?: (row: any) => React.ReactNode;
  emptyMessage?: string;
}

export function DataTable({
  columns,
  data,
  onRowClick,
  actions,
  emptyMessage = "No hay datos disponibles",
}: DataTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border" style={{ borderColor: colors.border }}>
      <table className="w-full">
        <thead style={{ backgroundColor: colors.background }}>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-3 text-left text-sm font-semibold"
                style={{ color: colors.text }}
              >
                {col.label}
              </th>
            ))}
            {actions && <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: colors.text }}>Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (actions ? 1 : 0)} className="px-4 py-8 text-center" style={{ color: colors.textMuted }}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, idx) => (
              <tr
                key={row.id || idx}
                className="border-t hover:bg-opacity-50 transition-colors cursor-pointer"
                style={{ borderColor: colors.border }}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-sm" style={{ color: colors.text }}>
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
                {actions && (
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    {actions(row)}
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
