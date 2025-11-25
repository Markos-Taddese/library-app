const StatCard = ({ title, value, colorClass }) => {
  return (
    <div className={`p-6 rounded-xl shadow-lg bg-white border-l-4 ${colorClass} transform hover:scale-[1.02] transition-transform duration-300`}> 
      <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{title}</p>
      <div className="mt-2 flex items-baseline">
        <p className="text-3xl font-extrabold text-gray-900">{value}</p>
      </div>
    </div>
  );
};

export default StatCard;