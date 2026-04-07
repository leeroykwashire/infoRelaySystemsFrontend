import { useState, useEffect, useMemo } from 'react';
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
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  useGetStocksQuery,
  useGetGoodsReceivedQuery,
  useGetGoodsIssuesQuery,
  useGetLedgerQuery,
} from '../services/api';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const AnalyticsPage = () => {
  const [activeTab, setActiveTab] = useState('turnover');
  const [timeRange, setTimeRange] = useState(30); // days
  
  // Fetch data
  const { data: stockData } = useGetStocksQuery();
  const { data: receivedData } = useGetGoodsReceivedQuery();
  const { data: issuedData } = useGetGoodsIssuesQuery();
  const { data: ledgerData } = useGetLedgerQuery();
  
  const stock = stockData?.results || [];
  const received = receivedData?.results || [];
  const issued = issuedData?.results || [];
  const ledger = ledgerData?.results || [];
  
  // Helper to format numbers
  const formatNumber = (num, decimals = 2) => {
    if (num === null || num === undefined) return '0';
    return Number(num).toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };
  
  // Filter data by time range
  const cutoffDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - timeRange);
    return date;
  }, [timeRange]);
  
  const recentIssued = useMemo(() => 
    issued.filter(item => new Date(item.issue_date) >= cutoffDate),
    [issued, cutoffDate]
  );
  
  const recentReceived = useMemo(() => 
    received.filter(item => new Date(item.received_date) >= cutoffDate),
    [received, cutoffDate]
  );
  
  // ABC Analysis (Pareto Analysis)
  const abcAnalysis = useMemo(() => {
    // Calculate total value issued per item
    const itemValues = {};
    recentIssued.forEach(issue => {
      const itemId = issue.item;
      const qty = Number(issue.quantity) || 0;
      if (!itemValues[itemId]) {
        itemValues[itemId] = {
          id: itemId,
          name: issue.item_name || 'Unknown',
          totalQty: 0,
          frequency: 0
        };
      }
      itemValues[itemId].totalQty += qty;
      itemValues[itemId].frequency += 1;
    });
    
    // Sort by quantity descending
    const sorted = Object.values(itemValues).sort((a, b) => b.totalQty - a.totalQty);
    
    // Calculate cumulative percentage
    const totalQty = sorted.reduce((sum, item) => sum + item.totalQty, 0);
    let cumulative = 0;
    
    const classified = sorted.map(item => {
      cumulative += item.totalQty;
      const cumulativePercent = (cumulative / totalQty) * 100;
      
      let category;
      if (cumulativePercent <= 80) category = 'A';
      else if (cumulativePercent <= 95) category = 'B';
      else category = 'C';
      
      return {
        ...item,
        percentage: (item.totalQty / totalQty) * 100,
        cumulativePercent,
        category
      };
    });
    
    return classified;
  }, [recentIssued]);
  
  // Stock Turnover Ratio
  const turnoverAnalysis = useMemo(() => {
    return stock.map(stockItem => {
      const itemId = stockItem.item;
      const currentStock = Number(stockItem.quantity) || 0;
      
      // Total issued in time range
      const totalIssued = recentIssued
        .filter(issue => issue.item === itemId)
        .reduce((sum, issue) => sum + (Number(issue.quantity) || 0), 0);
      
      // Average stock (simplified: current stock)
      const avgStock = currentStock || 1;
      
      // Turnover ratio = Total Issued / Average Stock
      const turnoverRatio = totalIssued / avgStock;
      
      // Days to stockout (if current rate continues)
      const daysToStockout = totalIssued > 0 ? (currentStock / (totalIssued / timeRange)) : Infinity;
      
      return {
        id: itemId,
        name: stockItem.item_name || 'Unknown',
        currentStock,
        totalIssued,
        turnoverRatio,
        daysToStockout: daysToStockout === Infinity ? '>365' : Math.round(daysToStockout),
        reorderLevel: Number(stockItem.reorder_level) || 0,
        needsReorder: currentStock <= Number(stockItem.reorder_level),
        unit: stockItem.item_unit || 'units'
      };
    }).sort((a, b) => b.turnoverRatio - a.turnoverRatio);
  }, [stock, recentIssued, timeRange]);
  
  // Time Series Data for Trends
  const trendData = useMemo(() => {
    // Group ledger by date
    const dailyData = {};
    
    ledger.forEach(entry => {
      const date = new Date(entry.transaction_date).toLocaleDateString();
      if (!dailyData[date]) {
        dailyData[date] = { in: 0, out: 0, date };
      }
      const qty = Number(entry.quantity) || 0;
      if (entry.transaction_type === 'IN') {
        dailyData[date].in += qty;
      } else if (entry.transaction_type === 'OUT') {
        dailyData[date].out += qty;
      }
    });
    
    // Sort by date
    return Object.values(dailyData).sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    ).slice(-timeRange);
  }, [ledger, timeRange]);
  
  // Moving Average (7-day)
  const movingAverages = useMemo(() => {
    const windowSize = 7;
    const outValues = trendData.map(d => d.out);
    const averages = [];
    
    for (let i = 0; i < outValues.length; i++) {
      if (i < windowSize - 1) {
        averages.push(null);
      } else {
        const window = outValues.slice(i - windowSize + 1, i + 1);
        const avg = window.reduce((sum, val) => sum + val, 0) / windowSize;
        averages.push(avg);
      }
    }
    
    return averages;
  }, [trendData]);
  
  // Chart: Stock Movement Trend
  const trendChartData = {
    labels: trendData.map(d => d.date),
    datasets: [
      {
        label: 'Stock In',
        data: trendData.map(d => d.in),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1
      },
      {
        label: 'Stock Out',
        data: trendData.map(d => d.out),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        tension: 0.1
      },
      {
        label: '7-Day MA (Out)',
        data: movingAverages,
        borderColor: 'rgb(153, 102, 255)',
        backgroundColor: 'rgba(153, 102, 255, 0.1)',
        borderDash: [5, 5],
        tension: 0.1,
        pointRadius: 0
      }
    ]
  };
  
  // Chart: ABC Distribution
  const abcCounts = abcAnalysis.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {});
  
  const abcChartData = {
    labels: ['Category A (High Value)', 'Category B (Medium Value)', 'Category C (Low Value)'],
    datasets: [{
      label: 'Number of Items',
      data: [abcCounts.A || 0, abcCounts.B || 0, abcCounts.C || 0],
      backgroundColor: [
        'rgba(255, 99, 132, 0.6)',
        'rgba(255, 206, 86, 0.6)',
        'rgba(75, 192, 192, 0.6)',
      ],
      borderColor: [
        'rgba(255, 99, 132, 1)',
        'rgba(255, 206, 86, 1)',
        'rgba(75, 192, 192, 1)',
      ],
      borderWidth: 1
    }]
  };
  
  // Chart: Turnover Comparison
  const topTurnoverItems = turnoverAnalysis.slice(0, 10);
  const turnoverChartData = {
    labels: topTurnoverItems.map(item => item.name),
    datasets: [{
      label: 'Turnover Ratio',
      data: topTurnoverItems.map(item => item.turnoverRatio),
      backgroundColor: 'rgba(54, 162, 235, 0.6)',
      borderColor: 'rgba(54, 162, 235, 1)',
      borderWidth: 1
    }]
  };
  
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      }
    }
  };

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>Data Science Analytics</h2>
          <p className="text-muted mb-0">
            Advanced analytics, forecasting, and insights
          </p>
        </div>
        <div className="d-print-none">
          <label className="me-2">Time Range:</label>
          <select 
            className="form-select form-select-sm d-inline-block w-auto"
            value={timeRange}
            onChange={(e) => setTimeRange(Number(e.target.value))}
          >
            <option value={7}>Last 7 Days</option>
            <option value={30}>Last 30 Days</option>
            <option value={90}>Last 90 Days</option>
            <option value={180}>Last 6 Months</option>
            <option value={365}>Last Year</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <ul className="nav nav-tabs mb-4 d-print-none">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'turnover' ? 'active' : ''}`}
            onClick={() => setActiveTab('turnover')}
          >
            <i className="bi bi-arrow-repeat me-2"></i>
            Turnover Analysis
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'abc' ? 'active' : ''}`}
            onClick={() => setActiveTab('abc')}
          >
            <i className="bi bi-diagram-3 me-2"></i>
            ABC Analysis
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'trends' ? 'active' : ''}`}
            onClick={() => setActiveTab('trends')}
          >
            <i className="bi bi-graph-up me-2"></i>
            Trends & Forecasting
          </button>
        </li>
      </ul>

      {/* Turnover Analysis Tab */}
      {activeTab === 'turnover' && (
        <div>
          {/* Summary Cards */}
          <div className="row mb-4">
            <div className="col-md-3">
              <div className="card shadow-sm border-primary">
                <div className="card-body">
                  <h6 className="text-muted mb-2">High Turnover Items</h6>
                  <h3 className="mb-0 text-primary">
                    {turnoverAnalysis.filter(i => i.turnoverRatio > 1).length}
                  </h3>
                  <small className="text-muted">Ratio {'>'} 1.0</small>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card shadow-sm border-warning">
                <div className="card-body">
                  <h6 className="text-muted mb-2">Needs Reorder</h6>
                  <h3 className="mb-0 text-warning">
                    {turnoverAnalysis.filter(i => i.needsReorder).length}
                  </h3>
                  <small className="text-muted">Below reorder level</small>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card shadow-sm border-danger">
                <div className="card-body">
                  <h6 className="text-muted mb-2">Critical Stock</h6>
                  <h3 className="mb-0 text-danger">
                    {turnoverAnalysis.filter(i => i.daysToStockout !== '>365' && Number(i.daysToStockout) < 30).length}
                  </h3>
                  <small className="text-muted">{'<'} 30 days to stockout</small>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card shadow-sm border-success">
                <div className="card-body">
                  <h6 className="text-muted mb-2">Avg Turnover Ratio</h6>
                  <h3 className="mb-0 text-success">
                    {formatNumber(
                      turnoverAnalysis.reduce((sum, i) => sum + i.turnoverRatio, 0) / 
                      (turnoverAnalysis.length || 1)
                    )}
                  </h3>
                  <small className="text-muted">System-wide</small>
                </div>
              </div>
            </div>
          </div>

          {/* Turnover Chart */}
          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <h5 className="card-title">Top 10 Items by Turnover Ratio</h5>
              <div style={{ height: '300px' }}>
                <Bar data={turnoverChartData} options={chartOptions} />
              </div>
            </div>
          </div>

          {/* Turnover Table */}
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="card-title">Detailed Turnover Analysis</h5>
              <div className="table-responsive">
                <table className="table table-hover table-sm">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th className="text-end">Current Stock</th>
                      <th className="text-end">Total Issued</th>
                      <th className="text-end">Turnover Ratio</th>
                      <th className="text-end">Days to Stockout</th>
                      <th className="text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {turnoverAnalysis.map(item => (
                      <tr key={item.id}>
                        <td className="fw-semibold">{item.name}</td>
                        <td className="text-end">{formatNumber(item.currentStock, 0)} {item.unit}</td>
                        <td className="text-end">{formatNumber(item.totalIssued, 0)}</td>
                        <td className="text-end">
                          <span className={`badge ${
                            item.turnoverRatio > 1 ? 'bg-success' : 
                            item.turnoverRatio > 0.5 ? 'bg-warning' : 
                            'bg-secondary'
                          }`}>
                            {formatNumber(item.turnoverRatio)}
                          </span>
                        </td>
                        <td className="text-end">
                          <span className={`${
                            item.daysToStockout !== '>365' && Number(item.daysToStockout) < 30 ? 'text-danger fw-bold' :
                            item.daysToStockout !== '>365' && Number(item.daysToStockout) < 60 ? 'text-warning' :
                            'text-muted'
                          }`}>
                            {item.daysToStockout} days
                          </span>
                        </td>
                        <td className="text-center">
                          {item.needsReorder && (
                            <span className="badge bg-warning">
                              <i className="bi bi-exclamation-triangle"></i> Reorder
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ABC Analysis Tab */}
      {activeTab === 'abc' && (
        <div>
          <div className="row mb-4">
            <div className="col-md-8">
              <div className="card shadow-sm">
                <div className="card-body">
                  <h5 className="card-title">ABC Classification (Pareto Analysis)</h5>
                  <p className="text-muted small">
                    Category A: Top 80% of usage | Category B: Next 15% | Category C: Remaining 5%
                  </p>
                  <div className="table-responsive">
                    <table className="table table-hover table-sm">
                      <thead>
                        <tr>
                          <th>Rank</th>
                          <th>Item</th>
                          <th className="text-end">Total Issued</th>
                          <th className="text-end">% of Total</th>
                          <th className="text-end">Cumulative %</th>
                          <th className="text-center">Category</th>
                        </tr>
                      </thead>
                      <tbody>
                        {abcAnalysis.map((item, index) => (
                          <tr key={item.id}>
                            <td>{index + 1}</td>
                            <td className="fw-semibold">{item.name}</td>
                            <td className="text-end">{formatNumber(item.totalQty, 0)}</td>
                            <td className="text-end">{formatNumber(item.percentage)}%</td>
                            <td className="text-end">{formatNumber(item.cumulativePercent)}%</td>
                            <td className="text-center">
                              <span className={`badge ${
                                item.category === 'A' ? 'bg-danger' :
                                item.category === 'B' ? 'bg-warning' :
                                'bg-success'
                              }`}>
                                {item.category}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card shadow-sm">
                <div className="card-body">
                  <h5 className="card-title">Category Distribution</h5>
                  <div style={{ height: '300px' }}>
                    <Pie data={abcChartData} options={chartOptions} />
                  </div>
                  <div className="mt-3">
                    <p className="small mb-2">
                      <strong>Category A:</strong> Focus intensive management and tight controls
                    </p>
                    <p className="small mb-2">
                      <strong>Category B:</strong> Moderate controls and monitoring
                    </p>
                    <p className="small mb-0">
                      <strong>Category C:</strong> Simple controls and periodic review
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trends & Forecasting Tab */}
      {activeTab === 'trends' && (
        <div>
          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <h5 className="card-title">Stock Movement Trends with Moving Average</h5>
              <p className="text-muted small">
                7-day moving average helps identify trends and smooth out daily fluctuations
              </p>
              <div style={{ height: '400px' }}>
                <Line data={trendChartData} options={chartOptions} />
              </div>
            </div>
          </div>

          {/* Insights */}
          <div className="row">
            <div className="col-md-6">
              <div className="card shadow-sm">
                <div className="card-body">
                  <h5 className="card-title">
                    <i className="bi bi-lightbulb text-warning me-2"></i>
                    Key Insights
                  </h5>
                  <ul className="list-unstyled">
                    <li className="mb-3">
                      <strong>Total Consumption:</strong> {formatNumber(
                        trendData.reduce((sum, d) => sum + d.out, 0), 0
                      )} units in last {timeRange} days
                    </li>
                    <li className="mb-3">
                      <strong>Average Daily Usage:</strong> {formatNumber(
                        trendData.reduce((sum, d) => sum + d.out, 0) / (trendData.length || 1), 0
                      )} units/day
                    </li>
                    <li className="mb-3">
                      <strong>Peak Usage Day:</strong> {
                        trendData.length > 0 
                          ? trendData.reduce((max, d) => d.out > max.out ? d : max, trendData[0]).date
                          : 'N/A'
                      }
                    </li>
                    <li className="mb-3">
                      <strong>Trend Direction:</strong>{' '}
                      {movingAverages.length >= 2 && movingAverages[movingAverages.length - 1] > movingAverages[movingAverages.length - 2] ? (
                        <span className="text-danger">
                          <i className="bi bi-arrow-up"></i> Increasing
                        </span>
                      ) : (
                        <span className="text-success">
                          <i className="bi bi-arrow-down"></i> Decreasing
                        </span>
                      )}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="card shadow-sm">
                <div className="card-body">
                  <h5 className="card-title">
                    <i className="bi bi-graph-up-arrow text-primary me-2"></i>
                    Forecasting Recommendations
                  </h5>
                  <div className="alert alert-info">
                    <p className="mb-2">
                      <strong>Predictive Reorder Points:</strong>
                    </p>
                    <p className="small mb-0">
                      Based on moving average analysis, consider setting reorder points at 
                      1.5x the average daily usage rate to maintain buffer stock and prevent stockouts.
                    </p>
                  </div>
                  <div className="alert alert-warning">
                    <p className="mb-2">
                      <strong>Seasonal Patterns:</strong>
                    </p>
                    <p className="small mb-0">
                      Review longer time periods (90+ days) to identify seasonal trends and 
                      adjust inventory levels accordingly.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsPage;
