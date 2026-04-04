import { useState, useMemo } from 'react';
import { useGetStocksQuery, useGetCategoriesQuery } from '../services/api';

const StockPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [lowStockThreshold, setLowStockThreshold] = useState(10);

  // Fetch data
  const { data: stocksData, isLoading: stocksLoading } = useGetStocksQuery();
  const { data: categoriesData } = useGetCategoriesQuery();

  const stocks = stocksData?.results || [];
  const categories = categoriesData?.results || [];

  // Filter and search stocks
  const filteredStocks = useMemo(() => {
    let filtered = stocks;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(stock =>
        stock.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stock.category_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter(stock => stock.item?.toString() === selectedCategory);
    }

    // Low stock filter
    if (showLowStockOnly) {
      filtered = filtered.filter(stock => stock.quantity <= lowStockThreshold);
    }

    return filtered;
  }, [stocks, searchTerm, selectedCategory, showLowStockOnly, lowStockThreshold]);

  // Calculate statistics
  const totalItems = stocks.length;
  const lowStockCount = stocks.filter(s => s.quantity <= lowStockThreshold).length;
  const totalValue = filteredStocks.length;

  // Get stock level badge
  const getStockBadge = (quantity) => {
    if (quantity === 0) {
      return <span className="badge bg-danger">Out of Stock</span>;
    } else if (quantity <= lowStockThreshold) {
      return <span className="badge bg-warning text-dark">Low Stock</span>;
    } else {
      return <span className="badge bg-success">In Stock</span>;
    }
  };

  // Get progress bar color
  const getProgressColor = (quantity) => {
    if (quantity === 0) return 'danger';
    if (quantity <= lowStockThreshold) return 'warning';
    return 'success';
  };

  return (
    <div>
      <h2 className="mb-4">Stock Levels</h2>

      {/* Statistics Cards */}
      <div className="row mb-4">
        <div className="col-md-4">
          <div className="card shadow-sm">
            <div className="card-body">
              <h6 className="text-muted mb-1">Total Items</h6>
              <h3 className="mb-0">{totalItems}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card shadow-sm border-warning">
            <div className="card-body">
              <h6 className="text-muted mb-1">Low Stock Items</h6>
              <h3 className="mb-0 text-warning">{lowStockCount}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card shadow-sm">
            <div className="card-body">
              <h6 className="text-muted mb-1">Showing</h6>
              <h3 className="mb-0">{totalValue}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3">
            {/* Search */}
            <div className="col-md-4">
              <label className="form-label">Search</label>
              <input
                type="text"
                className="form-control"
                placeholder="Search by item or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Category Filter */}
            <div className="col-md-3">
              <label className="form-label">Category</label>
              <select
                className="form-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Low Stock Threshold */}
            <div className="col-md-3">
              <label className="form-label">Low Stock Threshold</label>
              <input
                type="number"
                className="form-control"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(Number(e.target.value))}
                min="1"
              />
            </div>

            {/* Low Stock Toggle */}
            <div className="col-md-2 d-flex align-items-end">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="lowStockOnly"
                  checked={showLowStockOnly}
                  onChange={(e) => setShowLowStockOnly(e.target.checked)}
                />
                <label className="form-check-label" htmlFor="lowStockOnly">
                  Low Stock Only
                </label>
              </div>
            </div>
          </div>

          {/* Active Filters Display */}
          {(searchTerm || selectedCategory || showLowStockOnly) && (
            <div className="mt-3">
              <small className="text-muted">Active filters: </small>
              {searchTerm && (
                <span className="badge bg-secondary me-2">
                  Search: {searchTerm}
                  <button
                    className="btn-close btn-close-white ms-2"
                    style={{ fontSize: '0.6rem' }}
                    onClick={() => setSearchTerm('')}
                  ></button>
                </span>
              )}
              {selectedCategory && (
                <span className="badge bg-secondary me-2">
                  Category: {categories.find(c => c.id.toString() === selectedCategory)?.name}
                  <button
                    className="btn-close btn-close-white ms-2"
                    style={{ fontSize: '0.6rem' }}
                    onClick={() => setSelectedCategory('')}
                  ></button>
                </span>
              )}
              {showLowStockOnly && (
                <span className="badge bg-warning text-dark me-2">
                  Low Stock Only
                  <button
                    className="btn-close ms-2"
                    style={{ fontSize: '0.6rem' }}
                    onClick={() => setShowLowStockOnly(false)}
                  ></button>
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stock Table */}
      <div className="card shadow-sm">
        <div className="card-body">
          {stocksLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : filteredStocks.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-inbox text-muted" style={{ fontSize: '3rem' }}></i>
              <p className="text-muted mt-3">
                {stocks.length === 0 
                  ? 'No stock data available.' 
                  : 'No items match your filters.'}
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead>
                  <tr>
                    <th>Item Name</th>
                    <th>Category</th>
                    <th>Quantity</th>
                    <th>Unit</th>
                    <th>Status</th>
                    <th>Stock Level</th>
                    <th>Last Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStocks.map((stock) => (
                    <tr key={stock.id}>
                      <td className="fw-semibold">{stock.item_name}</td>
                      <td>
                        <span className="badge bg-secondary">{stock.category_name}</span>
                      </td>
                      <td>
                        <span className={`fs-5 fw-bold text-${getProgressColor(stock.quantity)}`}>
                          {stock.quantity}
                        </span>
                      </td>
                      <td className="text-muted">{stock.item_unit}</td>
                      <td>{getStockBadge(stock.quantity)}</td>
                      <td style={{ width: '200px' }}>
                        <div className="progress" style={{ height: '20px' }}>
                          <div
                            className={`progress-bar bg-${getProgressColor(stock.quantity)}`}
                            role="progressbar"
                            style={{ width: `${Math.min((stock.quantity / 50) * 100, 100)}%` }}
                            aria-valuenow={stock.quantity}
                            aria-valuemin="0"
                            aria-valuemax="50"
                          >
                            {stock.quantity > 0 && <small>{stock.quantity}</small>}
                          </div>
                        </div>
                      </td>
                      <td className="text-muted small">
                        {new Date(stock.last_updated).toLocaleDateString()} <br />
                        <small>{new Date(stock.last_updated).toLocaleTimeString()}</small>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-3">
        <small className="text-muted">
          <strong>Stock Status:</strong> 
          <span className="ms-2">🟢 In Stock ({">"}{lowStockThreshold})</span>
          <span className="ms-3">🟡 Low Stock (1-{lowStockThreshold})</span>
          <span className="ms-3">🔴 Out of Stock (0)</span>
        </small>
      </div>
    </div>
  );
};

export default StockPage;
