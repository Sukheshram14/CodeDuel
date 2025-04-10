import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title
} from 'chart.js';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  Title
);

const PerformanceCharts = ({ stats }) => {
  // Win/Loss Ratio Chart Data
  const winLossData = {
    labels: ['Wins', 'Losses'],
    datasets: [
      {
        data: [stats.stats.wins || 0, stats.stats.losses || 0],
        backgroundColor: ['#10B981', '#EF4444'],
        borderColor: ['#059669', '#DC2626'],
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#9CA3AF'
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.label}: ${context.raw}`;
          }
        }
      }
    },
  };

  return (
    <div className="mb-8">
      {/* Win/Loss Ratio Chart */}
      <div className="card p-6 rounded-lg bg-gray-800">
        <h3 className="text-xl font-bold mb-4 text-neon-blue">Win/Loss Ratio</h3>
        <div className="h-64">
          {stats.stats.wins === 0 && stats.stats.losses === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-400">
              No matches played yet
            </div>
          ) : (
            <Doughnut data={winLossData} options={chartOptions} />
          )}
        </div>
      </div>
    </div>
  );
};

export default PerformanceCharts; 