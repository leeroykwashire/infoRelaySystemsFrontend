import { useState, useEffect } from 'react';
import {
  useGetStocksQuery,
  useGetGoodsReceivedQuery,
  useGetGoodsIssuesQuery,
  useGetLedgerQuery,
} from '../services/api';

// Helper function to format numbers with thousand separators
const formatNumber = (num, decimals = 0) => {
  if (num === null || num === undefined || num === '') return '—';
  return Number(num).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

// Helper to get unit label or default
const getUnit = (unit) => unit || 'pcs';

const ReportsPage = () => {
  const [activeTab, setActiveTab] = useState('stock');
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    itemId: '',
  });
  const [printOrientation, setPrintOrientation] = useState('landscape');
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [lastUpdated] = useState(new Date().toLocaleString());
  
  // Column visibility states for each table
  const [stockColumns, setStockColumns] = useState({
    name: true,
    sku: true,
    category: true,
    quantity: true,
    unit: true,
    reorderLevel: true,
    // unitPrice and totalValue removed per client request
    status: true,
  });
  
  const [receivedColumns, setReceivedColumns] = useState({
    date: true,
    item: true,
    quantity: true,
    supplier: true,
    receivedBy: true,
    remarks: true,
  });
  
  const [issuedColumns, setIssuedColumns] = useState({
    date: true,
    item: true,
    quantity: true,
    issuedTo: true,
    issuedBy: true,
    remarks: true,
  });
  
  const [ledgerColumns, setLedgerColumns] = useState({
    date: true,
    item: true,
    type: true,
    change: true,
    balance: true,
    reference: true,
    user: true,
    remarks: true,
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
      const requestedId = parseInt(filters.itemId, 10);
      filtered = filtered.filter(item => {
        // item may be a nested object (item: { id }) or a plain id (item: 3) or have item_id
        if (!requestedId) return true;
        if (typeof item.item === 'number' && item.item === requestedId) return true;
        if (item.item && typeof item.item === 'object' && item.item.id === requestedId) return true;
        if (item.item_id === requestedId) return true;
        return false;
      });
    }
    
    return filtered;
  };

  // Calculate filtered data BEFORE useEffect hooks
  const filteredReceived = filterByDateRange(received, 'received_date');
  const filteredIssued = filterByDateRange(issued, 'issue_date');
  const filteredLedger = filterByDateRange(ledger, 'transaction_date');
  
  // Function to detect mostly empty columns (>90% empty)
  const detectEmptyColumns = (data, columnKey) => {
    if (data.length === 0) return false;
    const emptyCount = data.filter(item => {
      const value = columnKey.split('.').reduce((obj, key) => obj?.[key], item);
      return !value || value === '';
    }).length;
    return (emptyCount / data.length) > 0.9;
  };
  
  // Calculate summaries
  const stockSummary = {
    totalItems: stock.length,
    totalQuantity: stock.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0),
    lowStock: stock.filter(item => Number(item.quantity) <= Number(item.reorder_level)).length,
  };

  const movementSummary = {
    totalReceived: filteredReceived.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0),
    totalIssued: filteredIssued.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0),
    receivedTransactions: filteredReceived.length,
    issuedTransactions: filteredIssued.length,
  };

  // Add print metadata and orientation
  useEffect(() => {
    const reportRoot = document.getElementById('reports-root');
    if (reportRoot) {
      const reportTitles = {
        stock: 'Stock Report',
        movement: 'Stock Movement Report',
        ledger: 'Stock Ledger Report'
      };
      reportRoot.setAttribute('data-report-title', reportTitles[activeTab]);
      reportRoot.setAttribute('data-print-date', new Date().toLocaleString());
    }
    
    // Update print orientation
    const style = document.getElementById('print-orientation-style');
    if (style) {
      style.textContent = `@media print { @page { size: A4 ${printOrientation}; } }`;
    }
  }, [activeTab, printOrientation]);
  
  // Auto-hide empty columns on data load
  useEffect(() => {
    if (stock.length > 0) {
      setStockColumns(prev => ({
        ...prev,
        sku: !detectEmptyColumns(stock, 'item.sku'),
        unit: !detectEmptyColumns(stock, 'item.unit'),
        remarks: !detectEmptyColumns(stock, 'remarks'),
      }));
    }
  }, [stock]);
  
  useEffect(() => {
    if (filteredReceived.length > 0) {
      setReceivedColumns(prev => ({
        ...prev,
        supplier: !detectEmptyColumns(filteredReceived, 'supplier'),
        remarks: !detectEmptyColumns(filteredReceived, 'remarks'),
      }));
    }
  }, [filteredReceived]);
  
  useEffect(() => {
    if (filteredIssued.length > 0) {
      setIssuedColumns(prev => ({
        ...prev,
        issuedTo: !detectEmptyColumns(filteredIssued, 'issued_to'),
        remarks: !detectEmptyColumns(filteredIssued, 'remarks'),
      }));
    }
  }, [filteredIssued]);
  
  useEffect(() => {
    if (filteredLedger.length > 0) {
      setLedgerColumns(prev => ({
        ...prev,
        reference: !detectEmptyColumns(filteredLedger, 'reference_id'),
        remarks: !detectEmptyColumns(filteredLedger, 'remarks'),
      }));
    }
  }, [filteredLedger]);
  
  // Close column selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showColumnSelector && !event.target.closest('.dropdown')) {
        setShowColumnSelector(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showColumnSelector]);

  // Print function
  const handlePrint = () => {
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

  return (
    <div id="reports-root">
      <style id="print-orientation-style">
        {`@media print { @page { size: A4 ${printOrientation}; } }`}
      </style>
      
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h2>Reports & Analytics</h2>
          <p className="text-muted mb-0">
            Generate and export stock reports
            <small className="ms-3 text-muted" style={{ fontSize: '0.75rem' }}>
              <i className="bi bi-clock me-1"></i>
              Last updated: {lastUpdated}
            </small>
          </p>
        </div>
        <div className="d-print-none d-flex gap-2">
          {/* Print Orientation Selector */}
          <div className="btn-group" role="group">
            <button
              type="button"
              className={`btn btn-outline-secondary btn-sm ${printOrientation === 'portrait' ? 'active' : ''}`}
              onClick={() => setPrintOrientation('portrait')}
              title="Print in Portrait mode"
            >
              <i className="bi bi-file-earmark-text"></i>
            </button>
            <button
              type="button"
              className={`btn btn-outline-secondary btn-sm ${printOrientation === 'landscape' ? 'active' : ''}`}
              onClick={() => setPrintOrientation('landscape')}
              title="Print in Landscape mode"
            >
              <i className="bi bi-file-earmark-text-fill" style={{ transform: 'rotate(90deg)' }}></i>
            </button>
          </div>
          
          {/* Column Selector */}
          <div className="dropdown">
            <button
              className="btn btn-outline-secondary btn-sm dropdown-toggle"
              onClick={() => setShowColumnSelector(!showColumnSelector)}
              title="Select visible columns"
            >
              <i className="bi bi-columns me-1"></i>
              Columns
            </button>
            {showColumnSelector && (
              <div className="dropdown-menu show p-3" style={{ minWidth: '250px', maxHeight: '400px', overflowY: 'auto' }}>
                <h6 className="dropdown-header">Visible Columns</h6>
                {activeTab === 'stock' && Object.keys(stockColumns).map(col => (
                  <div key={col} className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={stockColumns[col]}
                      onChange={(e) => setStockColumns({ ...stockColumns, [col]: e.target.checked })}
                      id={`stock-col-${col}`}
                    />
                    <label className="form-check-label" htmlFor={`stock-col-${col}`}>
                      {col.replace(/([A-Z])/g, ' $1').trim()}
                    </label>
                  </div>
                ))}
                {activeTab === 'movement' && (
                  <>
                    <small className="text-muted">Goods Received:</small>
                    {Object.keys(receivedColumns).map(col => (
                      <div key={col} className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={receivedColumns[col]}
                          onChange={(e) => setReceivedColumns({ ...receivedColumns, [col]: e.target.checked })}
                          id={`received-col-${col}`}
                        />
                        <label className="form-check-label" htmlFor={`received-col-${col}`}>
                          {col.replace(/([A-Z])/g, ' $1').trim()}
                        </label>
                      </div>
                    ))}
                    <hr className="my-2" />
                    <small className="text-muted">Goods Issued:</small>
                    {Object.keys(issuedColumns).map(col => (
                      <div key={col} className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={issuedColumns[col]}
                          onChange={(e) => setIssuedColumns({ ...issuedColumns, [col]: e.target.checked })}
                          id={`issued-col-${col}`}
                        />
                        <label className="form-check-label" htmlFor={`issued-col-${col}`}>
                          {col.replace(/([A-Z])/g, ' $1').trim()}
                        </label>
                      </div>
                    ))}
                  </>
                )}
                {activeTab === 'ledger' && Object.keys(ledgerColumns).map(col => (
                  <div key={col} className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={ledgerColumns[col]}
                      onChange={(e) => setLedgerColumns({ ...ledgerColumns, [col]: e.target.checked })}
                      id={`ledger-col-${col}`}
                    />
                    <label className="form-check-label" htmlFor={`ledger-col-${col}`}>
                      {col.replace(/([A-Z])/g, ' $1').trim()}
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <button className="btn btn-outline-primary" onClick={handlePrint}>
            <i className="bi bi-printer me-2"></i>
            Print Report
          </button>
        </div>
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
                      <h4 className="mb-0">{formatNumber(stockSummary.totalQuantity)} <small className="text-muted">units</small></h4>
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
            {/* Total Value removed per client request */}
          </div>

          {/* Export Button */}
          <div className="mb-3 d-print-none">
            <button
              className="btn btn-success"
              onClick={() => exportToCSV(
                stock.map(item => ({
                  'Item Name': item.item_name || item.item?.name || '—',
                  'SKU': item.item?.sku || '—',
                  'Category': item.category_name || item.item?.category?.name || '—',
                  'Quantity': item.quantity,
                  'Unit': item.item_unit || item.item?.unit || '—',
                  'Reorder Level': item.reorder_level,
                  'Last Updated': item.last_updated ? new Date(item.last_updated).toLocaleString() : '—',
                })),
                'stock_report'
              )}
            >
              <i className="bi bi-download me-2"></i>
              Export to CSV
            </button>
          </div>

          {/* Stock Table */}
          <div className="card shadow-sm report-section">
            <div className="card-body">
              <h5 className="card-title mb-3">
                Current Stock Levels
                <small className="badge bg-info text-white ms-2" style={{ fontSize: '0.7rem', verticalAlign: 'middle' }}>Totals (all)</small>
              </h5>
              <div className="table-responsive">
                <table className="table table-striped table-hover table-sm">
                  <thead>
                    <tr>
                      {stockColumns.name && <th title="Name of the inventory item">Item Name</th>}
                      {stockColumns.sku && <th title="Stock Keeping Unit identifier">SKU</th>}
                      {stockColumns.category && <th title="Product category">Category</th>}
                      {stockColumns.quantity && <th className="text-end" title="Current quantity in stock">Quantity</th>}
                      {stockColumns.unit && <th title="Unit of measurement">Unit</th>}
                      {stockColumns.reorderLevel && <th className="text-end" title="Minimum stock level before reorder">Reorder Level</th>}
                      {stockColumns.status && <th title="Stock status indicator">Status</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {stock.map((item) => (
                      <tr key={item.id}>
                        {stockColumns.name && <td className="fw-semibold">{item.item_name || item.item?.name || '—'}</td>}
                        {stockColumns.sku && <td className="text-muted">{item.item?.sku || '—'}</td>}
                        {stockColumns.category && <td>
                          <span className="badge bg-secondary">
                            {item.category_name || item.item?.category?.name || 'N/A'}
                          </span>
                        </td>}
                        {stockColumns.quantity && <td className="text-end">{formatNumber(item.quantity)}</td>}
                        {stockColumns.unit && <td>{getUnit(item.item_unit || item.item?.unit)}</td>}
                        {stockColumns.reorderLevel && <td className="text-end">{formatNumber(item.reorder_level)}</td>}
                        {stockColumns.status && <td>
                          {item.quantity <= item.reorder_level ? (
                            <span className="badge bg-danger">Low Stock</span>
                          ) : item.quantity <= item.reorder_level * 2 ? (
                            <span className="badge bg-warning">Medium</span>
                          ) : (
                            <span className="badge bg-success">Good</span>
                          )}
                        </td>}
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
                      <option key={item.item || item.id} value={item.item || item.id}>
                          {item.item_name || item.item?.name || '—'}
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
                  <p className="text-muted mb-1 small">Total Received <small className="badge bg-info text-white ms-1" style={{ fontSize: '0.6rem' }}>filtered</small></p>
                  <h4 className="text-success mb-0">{formatNumber(movementSummary.totalReceived)} <small className="text-muted">units</small></h4>
                  <small className="text-muted">{formatNumber(movementSummary.receivedTransactions)} transactions</small>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card shadow-sm border-danger">
                <div className="card-body">
                  <p className="text-muted mb-1 small">Total Issued <small className="badge bg-info text-white ms-1" style={{ fontSize: '0.6rem' }}>filtered</small></p>
                  <h4 className="text-danger mb-0">{formatNumber(movementSummary.totalIssued)} <small className="text-muted">units</small></h4>
                  <small className="text-muted">{formatNumber(movementSummary.issuedTransactions)} transactions</small>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card shadow-sm border-primary">
                <div className="card-body">
                  <p className="text-muted mb-1 small">Net Change <small className="badge bg-info text-white ms-1" style={{ fontSize: '0.6rem' }}>filtered</small></p>
                  <h4 className={`mb-0 ${movementSummary.totalReceived - movementSummary.totalIssued >= 0 ? 'text-success' : 'text-danger'}`}>
                    {movementSummary.totalReceived - movementSummary.totalIssued >= 0 ? '+' : ''}
                    {formatNumber(movementSummary.totalReceived - movementSummary.totalIssued)} <small className="text-muted">units</small>
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
                    'Item': item.item_name || item.item?.name || '—',
                    'SKU': item.item?.sku || '—',
                    'Quantity': item.quantity,
                    'Unit': item.item_unit || item.item?.unit || '—',
                    'Supplier': item.supplier || '—',
                    'Received By': item.received_by_username || item.received_by?.username || '—',
                    'Remarks': item.remarks || '—',
                  })),
                  ...filteredIssued.map(item => ({
                    'Type': 'Issued',
                    'Date': new Date(item.issue_date).toLocaleDateString(),
                    'Item': item.item_name || item.item?.name || '—',
                    'SKU': item.item?.sku || '—',
                    'Quantity': item.quantity,
                    'Unit': item.item_unit || item.item?.unit || '—',
                    'Issued To': item.issued_to || '—',
                    'Issued By': item.issued_by_username || item.issued_by?.username || '—',
                    'Remarks': item.remarks || '—',
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
          <div className="card shadow-sm mb-4 report-section">
            <div className="card-body">
              <h5 className="card-title mb-3 text-success">
                <i className="bi bi-arrow-down-circle me-2"></i>
                Goods Received
              </h5>
              <div className="table-responsive">
                <table className="table table-hover table-sm">
                  <thead>
                    <tr>
                      {receivedColumns.date && <th title="Date when goods were received">Date</th>}
                      {receivedColumns.item && <th title="Item received">Item</th>}
                      {receivedColumns.quantity && <th className="text-end" title="Quantity received">Quantity</th>}
                      {receivedColumns.supplier && <th title="Supplier or vendor name">Supplier</th>}
                      {receivedColumns.receivedBy && <th title="User who recorded the receipt">Received By</th>}
                      {receivedColumns.remarks && <th title="Additional notes">Remarks</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReceived.length === 0 ? (
                      <tr>
                        <td colSpan={Object.values(receivedColumns).filter(Boolean).length} className="text-center text-muted py-4">
                          No received transactions found
                        </td>
                      </tr>
                    ) : (
                      filteredReceived.map((item) => (
                        <tr key={item.id}>
                          {receivedColumns.date && <td>{new Date(item.received_date).toLocaleDateString()}</td>}
                          {receivedColumns.item && <td className="fw-semibold">{item.item_name || item.item?.name || '—'}</td>}
                          {receivedColumns.quantity && <td className="text-end text-success fw-bold">+{formatNumber(item.quantity)}</td>}
                          {receivedColumns.supplier && <td>{item.supplier || '—'}</td>}
                          {receivedColumns.receivedBy && <td>{item.received_by_username || item.received_by?.username || '—'}</td>}
                          {receivedColumns.remarks && <td className="text-muted small">{item.remarks || '—'}</td>}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Goods Issued Table */}
          <div className="card shadow-sm report-section">
            <div className="card-body">
              <h5 className="card-title mb-3 text-danger">
                <i className="bi bi-arrow-up-circle me-2"></i>
                Goods Issued
              </h5>
              <div className="table-responsive">
                <table className="table table-hover table-sm">
                  <thead>
                    <tr>
                      {issuedColumns.date && <th title="Date when goods were issued">Date</th>}
                      {issuedColumns.item && <th title="Item issued">Item</th>}
                      {issuedColumns.quantity && <th className="text-end" title="Quantity issued">Quantity</th>}
                      {issuedColumns.issuedTo && <th title="Recipient of issued goods">Issued To</th>}
                      {issuedColumns.issuedBy && <th title="User who issued the goods">Issued By</th>}
                      {issuedColumns.remarks && <th title="Additional notes">Remarks</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredIssued.length === 0 ? (
                      <tr>
                        <td colSpan={Object.values(issuedColumns).filter(Boolean).length} className="text-center text-muted py-4">
                          No issued transactions found
                        </td>
                      </tr>
                    ) : (
                      filteredIssued.map((item) => (
                        <tr key={item.id}>
                          {issuedColumns.date && <td>{new Date(item.issue_date).toLocaleDateString()}</td>}
                          {issuedColumns.item && <td className="fw-semibold">{item.item_name || item.item?.name || '—'}</td>}
                          {issuedColumns.quantity && <td className="text-end text-danger fw-bold">-{formatNumber(item.quantity)}</td>}
                          {issuedColumns.issuedTo && <td>{item.issued_to || '—'}</td>}
                          {issuedColumns.issuedBy && <td>{item.issued_by_username || item.issued_by?.username || '—'}</td>}
                          {issuedColumns.remarks && <td className="text-muted small">{item.remarks || '—'}</td>}
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
                      <option key={item.item || item.id} value={item.item || item.id}>
                        {item.item_name || item.item?.name || '—'}
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
                    'Item': item.item_name || item.item?.name || '—',
                    'SKU': item.item?.sku || '—',
                    'Type': item.transaction_type_display || item.transaction_type,
                    'Quantity Change': (item.transaction_type === 'IN' ? '+' : item.transaction_type === 'OUT' ? '-' : '') + (item.quantity || ''),
                    'Balance After': item.balance_after,
                    'Reference': (item.reference_type ? item.reference_type + ' ' : '') + (item.reference_id || ''),
                    'User': item.user_username || item.user?.username || '—',
                    'Remarks': item.remarks || '—',
                  })),
                  'stock_ledger_report'
                )}
            >
              <i className="bi bi-download me-2"></i>
              Export to CSV
            </button>
          </div>

          {/* Ledger Table */}
          <div className="card shadow-sm report-section">
            <div className="card-body">
              <h5 className="card-title mb-3">
                Complete Stock Ledger
                <small className="badge bg-info text-white ms-2" style={{ fontSize: '0.7rem', verticalAlign: 'middle' }}>Totals (filtered)</small>
              </h5>
              <div className="table-responsive">
                <table className="table table-hover table-sm">
                  <thead>
                    <tr>
                      {ledgerColumns.date && <th title="Transaction date and time">Date & Time</th>}
                      {ledgerColumns.item && <th title="Item involved in transaction">Item</th>}
                      {ledgerColumns.type && <th title="Transaction type (IN/OUT/ADJ)">Type</th>}
                      {ledgerColumns.change && <th className="text-end" title="Quantity change in transaction">Change</th>}
                      {ledgerColumns.balance && <th className="text-end" title="Stock balance after transaction">Balance</th>}
                      {ledgerColumns.reference && <th title="Reference number for transaction">Reference</th>}
                      {ledgerColumns.user && <th title="User who performed the transaction">User</th>}
                      {ledgerColumns.remarks && <th title="Additional notes">Remarks</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLedger.length === 0 ? (
                      <tr>
                        <td colSpan={Object.values(ledgerColumns).filter(Boolean).length} className="text-center text-muted py-4">
                          No ledger entries found
                        </td>
                      </tr>
                    ) : (
                      filteredLedger.map((entry) => (
                        <tr key={entry.id}>
                          {ledgerColumns.date && <td className="small">{new Date(entry.transaction_date).toLocaleString()}</td>}
                          {ledgerColumns.item && <td className="fw-semibold">{entry.item_name || entry.item?.name || '—'}</td>}
                          {ledgerColumns.type && <td>
                            <span className={`badge ${
                              entry.transaction_type === 'IN' ? 'bg-success' : 
                              entry.transaction_type === 'OUT' ? 'bg-danger' : 
                              'bg-warning'
                            }`}>
                              {entry.transaction_type_display || entry.transaction_type || 'N/A'}
                            </span>
                          </td>}
                          {ledgerColumns.change && <td className={`text-end fw-bold ${
                            entry.transaction_type === 'IN' ? 'text-success' : 
                            entry.transaction_type === 'OUT' ? 'text-danger' : 
                            'text-warning'
                          }`}>
                            {entry.transaction_type === 'IN' ? '+' : entry.transaction_type === 'OUT' ? '-' : ''}{formatNumber(entry.quantity)}
                          </td>}
                          {ledgerColumns.balance && <td className="text-end">{formatNumber(entry.balance_after)}</td>}
                          {ledgerColumns.reference && <td className="text-muted small">{(entry.reference_type ? entry.reference_type + ' ' : '') + (entry.reference_id || '—')}</td>}
                          {ledgerColumns.user && <td>{entry.user_username || entry.user?.username || '—'}</td>}
                          {ledgerColumns.remarks && <td className="text-muted small">{entry.remarks || '—'}</td>}
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


    </div>
  );
};

export default ReportsPage;
