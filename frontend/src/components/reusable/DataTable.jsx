// This component receives data (rows) and column definitions (headers)
const DataTable = ({ data, columns, title }) => {
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className="text-gray-500 p-4 border rounded-lg">
        No {title.toLowerCase()} found.
      </div>
    );
  }

  return (
    <div className="bg-white shadow-lg rounded-xl overflow-hidden mt-6">
      <table className="min-w-full divide-y divide-gray-200">
        
        {/* Table Header (using column definitions) */}
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        
        {/* Table Body (using data rows) */}
        <tbody className="divide-y divide-gray-200">
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-gray-50">
              {columns.map((column) => (
                <td 
                  key={column.key} 
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                >
                  {column.render ? column.render(row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;