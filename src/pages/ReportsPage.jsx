import { useState } from 'react';
import {
  useGetStocksQuery,
  useGetGoodsReceivedQuery,
  useGetGoodsIssuesQuery,
  useGetLedgerQuery,
} from '../services/api';

const ReportsPage = () => {
  const [activeTab, setActiveTab] = useState('stock');
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    itemId: '',
  });

  // Fetch data
  const { data: stockData } = useGetStocksQuery();
  const { data: receivedData } = useGetGoodsReceivedQuery();
  const { data: issuedData } = useGetGoodsIssuesQuery();
  const { data: ledgerData } = useGetLedgerQuery();

  const stock = stockData?.results || [];
  const received = receivedData?.results || [];
  const issued = issuedData?.results || [];
  const ledger = ledgerData?.results || [];

  // Filter by date range
  const filterByDateRange = (data, dateField) => {
    let filtered = [...data];
    
    if (filters.startDate) {
      filtered = filtered.filter(item => 
        new Date(item[dateField]) >= new Date(filters.startDate)
      );
    }
    
    if (filters.endDate) {
      filtered = filtered.filter(item => 
        new Date(item[dateField]) <= new Date(filters.endDate)
      );
    }
    
    if (filters.itemId) {
      filtered = filtered.filter(item => 
        item.item?.id === parseInt(filters.itemId) || item.item_id === parseInt(filters.itemId)
      );
    }
    
    return filtered;
  };

  // Print function
  const handlePrint = () => {
    // Use the default print behavior; print CSS will show only the report wrapper
    window.print();
  };

  // Export to CSV
  const exportToCSV = (data, filename) => {
    if (data.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Handle nested objects
          if (typeof value === 'object' && value !== null) {
            return `"${value.name || value.username || JSON.stringify(value)}"`;
          }
          // Escape quotes in strings
          return typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Calculate summaries
  const stockSummary = {
    totalItems: stock.length,
    totalQuantity: stock.reduce((sum, item) => sum + (item.quantity || 0), 0),
    lowStock: stock.filter(item => item.quantity <= item.reorder_level).length,
    totalValue: stock.reduce((sum, item) => sum + (item.quantity * (item.item?.unit_price || 0)), 0),
  };

  const filteredReceived = filterByDateRange(received, 'received_date');
  const filteredIssued = filterByDateRange(issued, 'issue_date');
  const filteredLedger = filterByDateRange(ledger, 'transaction_date');

  const movementSummary = {
    totalReceived: filteredReceived.reduce((sum, item) => sum + (item.quantity || 0), 0),
    totalIssued: filteredIssued.reduce((sum, item) => sum + (item.quantity || 0), 0),
    receivedTransactions: filteredReceived.length,
    issuedTransactions: filteredIssued.length,
  };

  return (
    <div id="reports-root">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>Reports & Analytics</h2>
          <p className="text-muted mb-0">Generate and export stock reports</p>
        </div>
        <button className="btn btn-outline-primary d-print-none" onClick={handlePrint}>
          <i className="bi bi-printer me-2"></i>
          Print Report
        </button>
      </div>

      {/* Tabs */}
      <ul className="nav nav-tabs mb-4 d-print-none">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'stock' ? 'active' : ''}`}
            onClick={() => setActiveTab('stock')}
          >
            <i className="bi bi-box-seam me-2"></i>
            Stock Report
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'movement' ? 'active' : ''}`}
            onClick={() => setActiveTab('movement')}
          >
            <i className="bi bi-arrow-left-right me-2"></i>
            Stock Movement
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'ledger' ? 'active' : ''}`}
            onClick={() => setActiveTab('ledger')}
          >
            <i className="bi bi-journal-text me-2"></i>
            Stock Ledger
          </button>
        </li>
      </ul>

      {/* Stock Report Tab */}
      {activeTab === 'stock' && (
        <div>
          {/* Summary Cards */}
          <div className="row mb-4">
            <div className="col-md-3">
              <div className="card shadow-sm">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <p className="text-muted mb-1 small">Total Items</p>
                      <h4 className="mb-0">{stockSummary.totalItems}</h4>
                    </div>
                    <i className="bi bi-box text-primary" style={{ fontSize: '2rem' }}></i>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card shadow-sm">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <p className="text-muted mb-1 small">Total Quantity</p>
                      <h4 className="mb-0">{stockSummary.totalQuantity}</h4>
                    </div>
                    <i className="bi bi-stack text-success" style={{ fontSize: '2rem' }}></i>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card shadow-sm">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <p className="text-muted mb-1 small">Low Stock Items</p>
                      <h4 className="mb-0">{stockSummary.lowStock}</h4>
                    </div>
                    <i className="bi bi-exclamation-triangle text-warning" style={{ fontSize: '2rem' }}></i>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card shadow-sm">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <p className="text-muted mb-1 small">Total Value</p>
                      <h4 className="mb-0">${stockSummary.totalValue.toFixed(2)}</h4>
                    </div>
                    <i className="bi bi-currency-dollar text-info" style={{ fontSize: '2rem' }}></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Export Button */}
          <div className="mb-3 d-print-none">
            <button
              className="btn btn-success"
              onClick={() => exportToCSV(
                stock.map(item => ({
                  'Item Name': item.item?.name,
                  'SKU': item.item?.sku,
                  'Category': item.item?.category?.name,
                  'Quantity': item.quantity,
                  'Unit': item.item?.unit,
                  'Reorder Level': item.reorder_level,
                  'Unit Price': item.item?.unit_price,
                  'Total Value': (item.quantity * (item.item?.unit_price || 0)).toFixed(2),
                  'Last Updated': new Date(item.last_updated).toLocaleString(),
                })),
                'stock_report'
              )}
            >
              <i className="bi bi-download me-2"></i>
              Export to CSV
            </button>
          </div>

          {/* Stock Table */}
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="card-title mb-3">Current Stock Levels</h5>
              <div className="table-responsive">
                <table className="table table-striped table-hover">
                  <thead>
                    <tr>
                      <th>Item Name</th>
                      <th>SKU</th>
                      <th>Category</th>
                      <th className="text-end">Quantity</th>
                      <th>Unit</th>
                      <th className="text-end">Reorder Level</th>
                      <th className="text-end">Unit Price</th>
                      <th className="text-end">Total Value</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stock.map((item) => (
                      <tr key={item.id}>
                        <td className="fw-semibold">{item.item?.name}</td>
                        <td className="text-muted">{item.item?.sku}</td>
                        <td>
                          <span className="badge bg-secondary">
                            {item.item?.category?.name}
                          </span>
                        </td>
                        <td className="text-end">{item.quantity}</td>
                        <td>{item.item?.unit}</td>
                        <td className="text-end">{item.reorder_level}</td>
                        <td className="text-end">${item.item?.unit_price}</td>
                        <td className="text-end">
                          ${(item.quantity * (item.item?.unit_price || 0)).toFixed(2)}
                        </td>
                        <td>
                          {item.quantity <= item.reorder_level ? (
                            <span className="badge bg-danger">Low Stock</span>
                          ) : item.quantity <= item.reorder_level * 2 ? (
                            <span className="badge bg-warning">Medium</span>
                          ) : (
                            <span className="badge bg-success">Good</span>
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

      {/* Stock Movement Tab */}
      {activeTab === 'movement' && (
        <div>
          {/* Filters */}
          <div className="card shadow-sm mb-4 d-print-none">
            <div className="card-body">
              <h5 className="card-title mb-3">Filter Options</h5>
              <div className="row">
                <div className="col-md-3">
                  <label htmlFor="startDate" className="form-label">Start Date</label>
                  <input
                    type="date"
                    className="form-control"
                    id="startDate"
                    value={filters.startDate}
                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  />
                </div>
                <div className="col-md-3">
                  <label htmlFor="endDate" className="form-label">End Date</label>
                  <input
                    type="date"
                    className="form-control"
                    id="endDate"
                    value={filters.endDate}
                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  />
                </div>
                <div className="col-md-3">
                  <label htmlFor="itemFilter" className="form-label">Item</label>
                  <select
                    className="form-select"
                    id="itemFilter"
                    value={filters.itemId}
                    onChange={(e) => setFilters({ ...filters, itemId: e.target.value })}
                  >
                    <option value="">All Items</option>
                    {stock.map((item) => (
                      <option key={item.item?.id} value={item.item?.id}>
                        {item.item?.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3 d-flex align-items-end">
                  <button
                    className="btn btn-secondary w-100"
                    onClick={() => setFilters({ startDate: '', endDate: '', itemId: '' })}
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="row mb-4">
            <div className="col-md-3">
              <div className="card shadow-sm border-success">
                <div className="card-body">
                  <p className="text-muted mb-1 small">Total Received</p>
                  <h4 className="text-success mb-0">{movementSummary.totalReceived}</h4>
                  <small className="text-muted">{movementSummary.receivedTransactions} transactions</small>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card shadow-sm border-danger">
                <div className="card-body">
                  <p className="text-muted mb-1 small">Total Issued</p>
                  <h4 className="text-danger mb-0">{movementSummary.totalIssued}</h4>
                  <small className="text-muted">{movementSummary.issuedTransactions} transactions</small>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card shadow-sm border-primary">
                <div className="card-body">
                  <p className="text-muted mb-1 small">Net Change</p>
                  <h4 className={`mb-0 ${movementSummary.totalReceived - movementSummary.totalIssued >= 0 ? 'text-success' : 'text-danger'}`}>
                    {movementSummary.totalReceived - movementSummary.totalIssued >= 0 ? '+' : ''}
                    {movementSummary.totalReceived - movementSummary.totalIssued}
                  </h4>
                  <small className="text-muted">Overall change</small>
                </div>
              </div>
            </div>
          </div>

          {/* Export Button */}
          <div className="mb-3 d-print-none">
            <button
              className="btn btn-success"
              onClick={() => {
                const combinedData = [
                  ...filteredReceived.map(item => ({
                    'Type': 'Received',
                    'Date': new Date(item.received_date).toLocaleDateString(),
                    'Item': item.item?.name,
                    'SKU': item.item?.sku,
                    'Quantity': item.quantity,
                    'Unit': item.item?.unit,
                    'Supplier': item.supplier,
                    'Received By': item.received_by?.username,
                    'Remarks': item.remarks,
                  })),
                  ...filteredIssued.map(item => ({
                    'Type': 'Issued',
                    'Date': new Date(item.issue_date).toLocaleDateString(),
                    'Item': item.item?.name,
                    'SKU': item.item?.sku,
                    'Quantity': item.quantity,
                    'Unit': item.item?.unit,
                    'Issued To': item.issued_to,
                    'Issued By': item.issued_by?.username,
                    'Remarks': item.remarks,
                  })),
                ].sort((a, b) => new Date(b.Date) - new Date(a.Date));
                
                exportToCSV(combinedData, 'stock_movement_report');
              }}
            >
              <i className="bi bi-download me-2"></i>
              Export to CSV
            </button>
          </div>

          {/* Goods Received Table */}
          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <h5 className="card-title mb-3 text-success">
                <i className="bi bi-arrow-down-circle me-2"></i>
                Goods Received
              </h5>
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Item</th>
                      <th className="text-end">Quantity</th>
                      <th>Supplier</th>
                      <th>Received By</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReceived.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center text-muted py-4">
                          No received transactions found
                        </td>
                      </tr>
                    ) : (
                      filteredReceived.map((item) => (
                        <tr key={item.id}>
                          <td>{new Date(item.received_date).toLocaleDateString()}</td>
                          <td className="fw-semibold">{item.item?.name}</td>
                          <td className="text-end text-success fw-bold">+{item.quantity}</td>
                          <td>{item.supplier}</td>
                          <td>{item.received_by?.username}</td>
                          <td className="text-muted small">{item.remarks || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Goods Issued Table */}
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="card-title mb-3 text-danger">
                <i className="bi bi-arrow-up-circle me-2"></i>
                Goods Issued
              </h5>
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Item</th>
                      <th className="text-end">Quantity</th>
                      <th>Issued To</th>
                      <th>Issued By</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredIssued.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center text-muted py-4">
                          No issued transactions found
                        </td>
                      </tr>
                    ) : (
                      filteredIssued.map((item) => (
                        <tr key={item.id}>
                          <td>{new Date(item.issue_date).toLocaleDateString()}</td>
                          <td className="fw-semibold">{item.item?.name}</td>
                          <td className="text-end text-danger fw-bold">-{item.quantity}</td>
                          <td>{item.issued_to}</td>
                          <td>{item.issued_by?.username}</td>
                          <td className="text-muted small">{item.remarks || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stock Ledger Tab */}
      {activeTab === 'ledger' && (
        <div>
          {/* Filters */}
          <div className="card shadow-sm mb-4 d-print-none">
            <div className="card-body">
              <h5 className="card-title mb-3">Filter Options</h5>
              <div className="row">
                <div className="col-md-3">
                  <label htmlFor="ledgerStartDate" className="form-label">Start Date</label>
                  <input
                    type="date"
                    className="form-control"
                    id="ledgerStartDate"
                    value={filters.startDate}
                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  />
                </div>
                <div className="col-md-3">
                  <label htmlFor="ledgerEndDate" className="form-label">End Date</label>
                  <input
                    type="date"
                    className="form-control"
                    id="ledgerEndDate"
                    value={filters.endDate}
                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  />
                </div>
                <div className="col-md-3">
                  <label htmlFor="ledgerItemFilter" className="form-label">Item</label>
                  <select
                    className="form-select"
                    id="ledgerItemFilter"
                    value={filters.itemId}
                    onChange={(e) => setFilters({ ...filters, itemId: e.target.value })}
                  >
                    <option value="">All Items</option>
                    {stock.map((item) => (
                      <option key={item.item?.id} value={item.item?.id}>
                        {item.item?.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3 d-flex align-items-end">
                  <button
                    className="btn btn-secondary w-100"
                    onClick={() => setFilters({ startDate: '', endDate: '', itemId: '' })}
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Export Button */}
          <div className="mb-3 d-print-none">
            <button
              className="btn btn-success"
              onClick={() => exportToCSV(
                filteredLedger.map(item => ({
                  'Date': new Date(item.transaction_date).toLocaleString(),
                  'Item': item.item?.name,
                  'SKU': item.item?.sku,
                  'Type': item.transaction_type,
                  'Quantity Change': item.quantity_change,
                  'Balance After': item.balance_after,
                  'Reference': item.reference_number,
                  'User': item.user?.username,
                  'Remarks': item.remarks,
                })),
                'stock_ledger_report'
              )}
            >
              <i className="bi bi-download me-2"></i>
              Export to CSV
            </button>
          </div>

          {/* Ledger Table */}
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="card-title mb-3">Complete Stock Ledger</h5>
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Date & Time</th>
                      <th>Item</th>
                      <th>Type</th>
                      <th className="text-end">Change</th>
                      <th className="text-end">Balance</th>
                      <th>Reference</th>
                      <th>User</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLedger.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="text-center text-muted py-4">
                          No ledger entries found
                        </td>
                      </tr>
                    ) : (
                      filteredLedger.map((entry) => (
                        <tr key={entry.id}>
                          <td className="small">{new Date(entry.transaction_date).toLocaleString()}</td>
                          <td className="fw-semibold">{entry.item?.name}</td>
                          <td>
                            <span className={`badge ${
                              entry.transaction_type === 'IN' ? 'bg-success' : 
                              entry.transaction_type === 'OUT' ? 'bg-danger' : 
                              'bg-warning'
                            }`}>
                              {entry.transaction_type}
                            </span>
                          </td>
                          <td className={`text-end fw-bold ${
                            entry.quantity_change > 0 ? 'text-success' : 
                            entry.quantity_change < 0 ? 'text-danger' : 
                            'text-warning'
                          }`}>
                            {entry.quantity_change > 0 ? '+' : ''}{entry.quantity_change}
                          </td>
                          <td className="text-end">{entry.balance_after}</td>
                          <td className="text-muted small">{entry.reference_number}</td>
                          <td>{entry.user?.username}</td>
                          <td className="text-muted small">{entry.remarks || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print Styles */}
      <style>{`
        @media print {
          /* hide everything by default */
          body * {
            visibility: hidden;
          }
          /* show only the report wrapper and its children */
          #reports-root, #reports-root * {
            visibility: visible;
          }
          /* hide controls marked as d-print-none */
          .d-print-none {
            display: none !important;
          }
          .card {
            border: 1px solid #dee2e6 !important;
            box-shadow: none !important;
          }
          .table {
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  );
};

export default ReportsPage;
