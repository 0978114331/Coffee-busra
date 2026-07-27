import { useState, useMemo } from 'react';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import { useStore } from '@/store/useStore';
import StatCard from '@/components/StatCard';
import OrderRow from '@/components/OrderRow';
import { chartColors, baseChartOptions } from '@/lib/chartSetup';
import {
  isToday,
  getRevenueData,
  getCategorySales,
  getTopProducts,
  getBestSeller,
  getTopCategory,
  getTotalProductsSold,
  getAvgOrderValue,
} from '@/lib/analytics';
import type { Order } from '@/types';

export default function Overview() {
  const t = useStore((s) => s.t);
  const orders = useStore((s) => s.orders);
  const tables = useStore((s) => s.tables);
  const [chartMode, setChartMode] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const todayOrders = useMemo(() => orders.filter((o) => isToday(o.created_at)), [orders]);
  const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0);
  const activeTables = tables.filter((tbl) => tbl.status === 'occupied').length;
  const pendingCount = orders.filter((o) => o.status === 'pending').length;

  const revenueData = useMemo(() => getRevenueData(orders, chartMode), [orders, chartMode]);
  const categoryData = useMemo(() => getCategorySales(orders), [orders]);
  const topProductsData = useMemo(() => getTopProducts(orders), [orders]);

  const recentOrders = orders.slice(0, 5);

  const lineData = {
    labels: revenueData.labels,
    datasets: [
      {
        label: t('revenue'),
        data: revenueData.data,
        borderColor: chartColors.gold,
        backgroundColor: 'rgba(201, 168, 76, 0.15)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: chartColors.gold2,
        pointBorderColor: chartColors.gold,
        pointRadius: 5,
      },
    ],
  };

  const doughnutData = {
    labels: categoryData.labels,
    datasets: [
      {
        data: categoryData.data,
        backgroundColor: [chartColors.gold, chartColors.green, chartColors.blue, chartColors.red, '#9b59b6', '#e67e22', '#1abc9c'],
        borderColor: chartColors.surface,
        borderWidth: 2,
      },
    ],
  };

  const barData = {
    labels: topProductsData.labels,
    datasets: [
      {
        label: t('items'),
        data: topProductsData.data,
        backgroundColor: chartColors.gold,
        borderColor: chartColors.gold2,
        borderWidth: 1,
      },
    ],
  };

  const barOptions = {
    ...baseChartOptions,
    plugins: { ...baseChartOptions.plugins, legend: { display: false } },
    indexAxis: 'y' as const,
  };

  return (
    <div className="fade-in">
      <div className="stats-row">
        <StatCard label={t('today')} value={todayOrders.length} />
        <StatCard label={t('revenue')} value={`$${todayRevenue.toFixed(2)}`} />
        <StatCard label={t('activeTables')} value={activeTables} />
        <StatCard label={t('pending')} value={pendingCount} />
      </div>

      <div className="chart-container">
        <div className="section-title" style={{ marginBottom: 0 }}>
          <span>{t('dailyRevenue')}</span>
        </div>
        <div className="chart-actions">
          {(['daily', 'weekly', 'monthly'] as const).map((mode) => (
            <button
              key={mode}
              className={`chart-btn ${chartMode === mode ? 'active' : ''}`}
              onClick={() => setChartMode(mode)}
            >
              {mode === 'daily' ? t('today') : mode === 'weekly' ? t('thisWeek') : t('thisMonth')}
            </button>
          ))}
        </div>
        <div className="chart-wrapper">
          <Line data={lineData} options={baseChartOptions} />
        </div>
      </div>

      <div className="two-col">
        <div>
          <div className="section-title"><span>{t('recentOrders')}</span></div>
          <div className="orders-panel">
            <div className="order-row header">
              <div>ID</div>
              <div>{t('table')}</div>
              <div>{t('items')}</div>
              <div>{t('total')}</div>
              <div>{t('status')}</div>
              <div>{t('actions')}</div>
            </div>
            {recentOrders.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>{t('noOrders')}</div>
            ) : (
              recentOrders.map((order: Order) => (
                <OrderRow key={order.id} order={order} />
              ))
            )}
          </div>
        </div>
        <div>
          <div className="section-title">{t('tables')}</div>
          <div className="tables-grid">
            {tables.map((tbl) => {
              const activeCount = orders.filter((o) => o.table_num === tbl.num && o.status !== 'done').length;
              return (
              <div key={tbl.id} className={`table-card ${tbl.status === 'occupied' ? 'occupied' : ''}`}>
                {tbl.status === 'occupied' && <span className="table-pulse-dot" />}
                {activeCount > 0 && <span className="table-count-badge">{activeCount}</span>}
                <div className="table-num">{tbl.num}</div>
                <div className={`table-status ${tbl.status === 'occupied' ? 'busy' : 'free'}`}>
                  {tbl.status === 'occupied' ? t('activeOrders') : t('available')}
                </div>
              </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="section-title" style={{ marginTop: '3rem' }}><span>{t('productAnalytics')}</span></div>
      <div className="stats-row">
        <StatCard label={t('items')} value={getTotalProductsSold(orders)} />
        <StatCard label={t('category')} value={getTopCategory(orders)} />
        <StatCard label={t('bestSeller')} value={<span style={{ fontSize: '1.5rem' }}>{getBestSeller(orders)}</span>} />
        <StatCard label={t('avgOrder')} value={`$${getAvgOrderValue(orders).toFixed(2)}`} />
      </div>

      <div className="two-col">
        <div className="chart-container">
          <div className="stat-label" style={{ marginBottom: '1rem', fontSize: '1.1rem', color: 'var(--cream)' }}>
            {t('categorySales')}
          </div>
          <div className="chart-wrapper">
            <Doughnut data={doughnutData} options={{ ...baseChartOptions, scales: undefined }} />
          </div>
        </div>
        <div className="chart-container">
          <div className="stat-label" style={{ marginBottom: '1rem', fontSize: '1.1rem', color: 'var(--cream)' }}>
            {t('topProducts')}
          </div>
          <div className="chart-wrapper" style={{ height: '400px' }}>
            <Bar data={barData} options={barOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}
