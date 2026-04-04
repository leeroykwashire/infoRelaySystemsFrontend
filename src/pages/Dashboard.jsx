import { useGetStocksQuery, useGetGoodsReceivedQuery, useGetGoodsIssuesQuery } from '../services/api';

const Dashboard = () => {
  // Fetch data using RTK Query
  const { data: stocksData, isLoading: stocksLoading } = useGetStocksQuery();
  const { data: goodsReceivedData, isLoading: grLoading } = useGetGoodsReceivedQuery({ limit: 5 });
  const { data: goodsIssuesData, isLoading: giLoading } = useGetGoodsIssuesQuery({ limit: 5 });

  // Calculate summary metrics
  const totalItems = stocksData?.results?.length || 0;
  const lowStockItems = stocksData?.results?.filter(stock => stock.quantity <= 10)?.length || 0;
  const recentReceived = goodsReceivedData?.results?.slice(0, 5) || [];
  const recentIssued = goodsIssuesData?.results?.slice(0, 5) || [];

  return (
    <div>
      <h2 className="mb-4">Dashboard</h2>

      {/* Summary Cards */}
      <div className="row mb-4">
        {/* Total Items Card */}
        <div className="col-md-4 mb-3">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">Total Items</h6>
                  {stocksLoading ? (
                    <div className="spinner-border spinner-border-sm" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  ) : (
                    <h2 className="mb-0">{totalItems}</h2>
                  )}
                </div>
                <div className="bg-primary bg-opacity-10 p-3 rounded">
                  <i className="bi bi-box-seam text-primary" style={{ fontSize: '2rem' }}></i>
                </div>
              </div>
              <p className="text-muted small mb-0 mt-2">Total tracked inventory items</p>
            </div>
          </div>
        </div>

        {/* Low Stock Alert Card */}
        <div className="col-md-4 mb-3">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">Low Stock Alerts</h6>
                  {stocksLoading ? (
                    <div className="spinner-border spinner-border-sm" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  ) : (
                    <h2 className="mb-0 text-warning">{lowStockItems}</h2>
                  )}
                </div>
                <div className="bg-warning bg-opacity-10 p-3 rounded">
                  <i className="bi bi-exclamation-triangle text-warning" style={{ fontSize: '2rem' }}></i>
                </div>
              </div>
              <p className="text-muted small mb-0 mt-2">Items with quantity ≤ 10</p>
            </div>
          </div>
        </div>

        {/* Recent Activity Card */}
        <div className="col-md-4 mb-3">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">Recent Transactions</h6>
                  {(grLoading || giLoading) ? (
                    <div className="spinner-border spinner-border-sm" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  ) : (
                    <h2 className="mb-0 text-success">{recentReceived.length + recentIssued.length}</h2>
                  )}
                </div>
                <div className="bg-success bg-opacity-10 p-3 rounded">
                  <i className="bi bi-arrow-left-right text-success" style={{ fontSize: '2rem' }}></i>
                </div>
              </div>
              <p className="text-muted small mb-0 mt-2">Last 5 IN/OUT transactions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="row">
        {/* Recent Goods Received */}
        <div className="col-md-6 mb-4">
          <div className="card shadow-sm">
            <div className="card-header bg-white">
              <h5 className="mb-0">Recent Goods Received</h5>
            </div>
            <div className="card-body">
              {grLoading ? (
                <div className="text-center py-4">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : recentReceived.length === 0 ? (
                <p className="text-muted text-center py-4">No recent goods received</p>
              ) : (
                <div className="list-group list-group-flush">
                  {recentReceived.map((item) => (
                    <div key={item.id} className="list-group-item px-0">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h6 className="mb-1">{item.item_name}</h6>
                          <small className="text-muted">
                            By {item.received_by_username} • {new Date(item.received_date).toLocaleDateString()}
                          </small>
                        </div>
                        <span className="badge bg-success">+{item.quantity}</span>
                      </div>
                      {item.remarks && (
                        <small className="text-muted d-block mt-1">{item.remarks}</small>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Goods Issued */}
        <div className="col-md-6 mb-4">
          <div className="card shadow-sm">
            <div className="card-header bg-white">
              <h5 className="mb-0">Recent Goods Issued</h5>
            </div>
            <div className="card-body">
              {giLoading ? (
                <div className="text-center py-4">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : recentIssued.length === 0 ? (
                <p className="text-muted text-center py-4">No recent goods issued</p>
              ) : (
                <div className="list-group list-group-flush">
                  {recentIssued.map((item) => (
                    <div key={item.id} className="list-group-item px-0">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h6 className="mb-1">{item.item_name}</h6>
                          <small className="text-muted">
                            To {item.issued_to} • {new Date(item.issued_date).toLocaleDateString()}
                          </small>
                        </div>
                        <span className="badge bg-danger">-{item.quantity}</span>
                      </div>
                      {item.remarks && (
                        <small className="text-muted d-block mt-1">{item.remarks}</small>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Low Stock Items Alert */}
      {!stocksLoading && lowStockItems > 0 && (
        <div className="row">
          <div className="col-12">
            <div className="card shadow-sm border-warning">
              <div className="card-header bg-warning bg-opacity-10">
                <h5 className="mb-0 text-warning">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  Low Stock Alert
                </h5>
              </div>
              <div className="card-body">
                <p className="mb-3">The following items have low stock levels (≤ 10 units):</p>
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Category</th>
                        <th>Current Stock</th>
                        <th>Unit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stocksData.results
                        .filter(stock => stock.quantity <= 10)
                        .slice(0, 5)
                        .map((stock) => (
                          <tr key={stock.id}>
                            <td>{stock.item_name}</td>
                            <td>{stock.category_name}</td>
                            <td>
                              <span className="badge bg-warning text-dark">{stock.quantity}</span>
                            </td>
                            <td>{stock.item_unit}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
                {lowStockItems > 5 && (
                  <p className="text-muted small mb-0 mt-2">
                    + {lowStockItems - 5} more items with low stock
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
