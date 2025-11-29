const StatCard = ({ title, value, colorClass, badge }) => {
  return (
    <div className={`
      relative p-4 lg:p-7 rounded-2xl shadow-xl 
      bg-white dark:bg-gray-800 
      border-l-4 ${colorClass} 
      transform hover:shadow-2xl transition-all duration-300 
      hover:scale-105
      w-full
    `}>
      {badge && (
        <span className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-600 text-white text-xs lg:text-sm px-2 lg:px-3 py-1 rounded-full font-semibold shadow-md">
          {badge.count} {badge.text}
        </span>
      )}
      <p className="text-xs lg:text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
        {title}
      </p>
      <div className="mt-2 lg:mt-3 flex items-baseline">
        <p className="text-2xl lg:text-4xl font-bold text-gray-900 dark:text-white">
          {value}
        </p>
      </div>
    </div>
  );
};

export default StatCard;