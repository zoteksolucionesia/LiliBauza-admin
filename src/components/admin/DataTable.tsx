"use client";

import { useRouter } from "next/navigation";

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
    <div className="overflow-x-auto rounded-lg border" style={{ borderColor: "#E8C4C4" }}>
      <table className="w-full">
        <thead style={{ backgroundColor: "#FDF8F8" }}>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-3 text-left text-sm font-semibold"
                style={{ color: "#3D2929" }}
              >
                {col.label}
              </th>
            ))}
            {actions && <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: "#3D2929" }}>Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (actions ? 1 : 0)} className="px-4 py-8 text-center" style={{ color: "#7D6B6B" }}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, idx) => (
              <tr
                key={row.id || idx}
                className="border-t hover:bg-opacity-50 transition-colors cursor-pointer"
                style={{ borderColor: "#E8C4C444" }}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-sm" style={{ color: "#3D2929" }}>
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
