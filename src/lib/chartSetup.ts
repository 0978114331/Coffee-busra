import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

export const chartColors = {
  gold: '#c9a84c',
  gold2: '#e8c97a',
  green: '#2ecc71',
  red: '#e74c3c',
  blue: '#3498db',
  cream: '#f5ead6',
  text: '#e8dcc8',
  muted: '#8a7d6b',
  surface: '#231f1a',
};

export const chartGridColor = 'rgba(201, 168, 76, 0.1)';
export const chartTextColor = '#8a7d6b';

export const baseChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: { color: chartTextColor, font: { family: 'DM Sans' } },
    },
  },
  scales: {
    x: {
      grid: { color: chartGridColor },
      ticks: { color: chartTextColor },
    },
    y: {
      grid: { color: chartGridColor },
      ticks: { color: chartTextColor },
    },
  },
};
