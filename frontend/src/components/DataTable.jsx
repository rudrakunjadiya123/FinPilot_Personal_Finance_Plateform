import React from 'react';

export default function DataTable({ columns, data }) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-ink-faint text-sm">
        No data available
      </div>
    );
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-border-default">
          {columns.map((col, i) => (
            <th 
              key={i} 
              className={`py-3 px-4 text-[11px] font-semibold text-ink-faint uppercase tracking-wider ${
                col.align === 'right' ? 'text-right' : 'text-left'
              }`}
            >
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((item, rowIdx) => (
          <tr 
            key={item.id || rowIdx} 
            className="border-b border-border-default/50 hover:bg-accent-soft/30 transition-colors duration-100 group"
          >
            {columns.map((col, colIdx) => (
              <td 
                key={colIdx} 
                className={`py-3 px-4 ${
                  col.align === 'right' ? 'text-right' : 'text-left'
                } ${
                  col.isMonospace ? 'font-mono font-medium text-ink' : 'text-ink-soft'
                } group-hover:text-ink transition-colors duration-100`}
              >
                {col.render ? col.render(item) : item[col.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
