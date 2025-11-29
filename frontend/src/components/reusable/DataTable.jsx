const DataTable = ({ data, columns, title }) => {
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className="text-gray-500 dark:text-gray-400 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
        No {title.toLowerCase()} found.
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl overflow-hidden mt-6 border border-gray-200 dark:border-gray-700">
      
      {/* Responsive Container */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          
          {/* Table Header */}
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          
          {/* Table Body */}
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {data.map((row, rowIndex) => (
              <tr 
                key={rowIndex} 
                className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {columns.map((column) => (
                  <td 
                    key={column.key} 
                    className="px-4 py-4 text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap"
                  >
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards View (hidden on larger screens) */}
      <div className="lg:hidden">
        {data.map((row, rowIndex) => (
          <div 
            key={rowIndex}
            className="border-b border-gray-200 dark:border-gray-700 last:border-b-0 p-4 hover:bg-gray-50 dark:hover:bg-gray-700"
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
          </div>
        ))}
      </div>
    </div>
  );
};

export default DataTable;