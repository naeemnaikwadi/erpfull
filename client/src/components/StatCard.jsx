// client/src/components/StatCard.jsx

import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatCard({ title, value, icon, color, trend, trendUp, subtitle }) {
  const getColorClasses = (color) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-50 border-blue-200 text-blue-900';
      case 'green':
        return 'bg-green-50 border-green-200 text-green-900';
      case 'purple':
        return 'bg-purple-50 border-purple-200 text-purple-900';
      case 'orange':
        return 'bg-orange-50 border-orange-200 text-orange-900';
      case 'red':
        return 'bg-red-50 border-red-200 text-red-900';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-900';
    }
  };

  const getIconColor = (color) => {
    switch (color) {
      case 'blue':
        return 'text-blue-600';
      case 'green':
        return 'text-green-600';
      case 'purple':
        return 'text-purple-600';
      case 'orange':
        return 'text-orange-600';
      case 'red':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className={`rounded-xl border p-6 ${getColorClasses(color)} transition-all duration-300 hover:shadow-lg hover:scale-105`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium opacity-75 mb-2">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
          {trend && (
            <div className="flex items-center mt-2">
              {trendUp ? (
                <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
              )}
              <span className={`text-sm font-medium ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
                {trend}
              </span>
            </div>
          )}
          {subtitle && (
            <p className="text-xs opacity-75 mt-2">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-full bg-white/50 ${getIconColor(color)}`}>
          {React.cloneElement(icon, { size: 24 })}
        </div>
      </div>
    </div>
  );
}
