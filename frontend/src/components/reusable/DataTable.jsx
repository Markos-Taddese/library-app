import React, { useState } from 'react';

const DataTable = ({ data, columns, title, renderExpansion }) => {
  const [expandedRowIndex, setExpandedRowIndex] = useState(null);

  const toggleRow = (index) => {
    setExpandedRowIndex(expandedRowIndex === index ? null : index);
  };

  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className="text-gray-500 dark:text-gray-400 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
        No {title?.toLowerCase() || 'records'} found.
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl overflow-hidden mt-6 border border-gray-200 dark:border-gray-700">
      {/* Desktop Table View */}
      <div className="overflow-x-auto hidden lg:block">
        <table className="min-w-full text-left border-collapse divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              {renderExpansion && <th className="px-4 py-3 w-10"></th>}
              {columns.map((column) => (
                <th key={column.key} className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {data.map((row, rowIndex) => (
              <React.Fragment key={rowIndex}>
                <tr 
                  onClick={() => renderExpansion && toggleRow(rowIndex)}
                  className={`transition-colors ${renderExpansion ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                >
                  {renderExpansion && (
                    <td className="px-4 py-4 text-center text-gray-400">
                      <span className={`inline-block transition-transform duration-200 ${expandedRowIndex === rowIndex ? 'rotate-90' : ''}`}>
                        ‣
                      </span>
                    </td>
                  )}
                  {columns.map((column) => (
                    <td key={column.key} className="px-4 py-4 text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap">
                      {column.render ? column.render(row) : row[column.key]}
                    </td>
                  ))}
                </tr>
                {/* Desktop Expansion Drawer */}
                {expandedRowIndex === rowIndex && renderExpansion && (
                  <tr className="bg-gray-50/50 dark:bg-gray-900/20">
                    <td colSpan={columns.length + (renderExpansion ? 1 : 0)} className="p-0 border-t border-gray-100 dark:border-gray-700">
                      {renderExpansion(row)}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards View */}
      <div className="lg:hidden">
        {data.map((row, rowIndex) => (
          <div key={rowIndex} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
            <div 
              onClick={() => renderExpansion && toggleRow(rowIndex)}
              className={`p-4 transition-colors ${renderExpansion ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700' : ''}`}
            >
              {columns.map((column) => (
                <div key={column.key} className="flex justify-between items-start mb-2 last:mb-0">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    {column.header}:
                  </span>
                  <span className="text-sm text-gray-900 dark:text-gray-100 text-right">
                    {column.render ? column.render(row) : row[column.key]}
                  </span>
                </div>
              ))}
              {renderExpansion && (
                <div className="text-center mt-2 text-xs text-gray-600 dark:text-gray-400 font-medium">
                  {expandedRowIndex === rowIndex ? 'Hide Copies ▲' : 'View Copies ▼'}
                </div>
              )}
            </div>
            {/* Mobile Expansion Area */}
            {expandedRowIndex === rowIndex && renderExpansion && (
              <div className="bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-700">
                {renderExpansion(row)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DataTable;