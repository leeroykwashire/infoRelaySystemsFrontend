import { useState } from 'react';
import { useGetItemsQuery, useGetGoodsIssuesQuery, useCreateGoodsIssueMutation } from '../services/api';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../features/auth/authSlice';

const GoodsIssuePage = () => {
  const [formData, setFormData] = useState({
    item: '',
    quantity: '',
    issued_to: '',
    remarks: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);

  const user = useSelector(selectCurrentUser);

  // Fetch data
  const { data: itemsData } = useGetItemsQuery();
  const { data: goodsIssuesData, isLoading: historyLoading } = useGetGoodsIssuesQuery();
  
  // Mutation
  const [createGoodsIssue, { isLoading: creating }] = useCreateGoodsIssueMutation();

  const items = itemsData?.results || [];
  const goodsIssues = goodsIssuesData?.results || [];

  // Get selected item details
  const selectedItem = items.find(item => item.id.toString() === formData.item);
  const availableStock = selectedItem?.current_stock || 0;

  // Check if quantity exceeds available stock
  const isOverStock = formData.quantity && parseFloat(formData.quantity) > availableStock;

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Validate form
  const validateForm = () => {
    const errors = {};

    if (!formData.item) {
      errors.item = 'Please select an item';
    }

    if (!formData.quantity || formData.quantity <= 0) {
      errors.quantity = 'Please enter a valid quantity greater than 0';
    } else if (parseFloat(formData.quantity) > availableStock) {
      errors.quantity = `Insufficient stock. Available: ${availableStock} ${selectedItem?.unit}`;
    }

    if (!formData.issued_to.trim()) {
      errors.issued_to = 'Please specify who is receiving the items';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await createGoodsIssue({
        item: parseInt(formData.item),
        quantity: parseFloat(formData.quantity),
        issued_to: formData.issued_to,
        remarks: formData.remarks,
      }).unwrap();

      // Reset form and show success
      setFormData({ item: '', quantity: '', issued_to: '', remarks: '' });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to record goods issue:', error);
      setFormErrors({ submit: error.data?.detail || error.data?.quantity?.[0] || 'Failed to record goods issue' });
    }
  };

  return (
    <div>
      <h2 className="mb-4">Goods Issue (Stock OUT)</h2>

      <div className="row">
        {/* Form Section */}
        <div className="col-md-5 mb-4">
          <div className="card shadow-sm">
            <div className="card-header bg-danger text-white">
              <h5 className="mb-0">
                <i className="bi bi-dash-circle me-2"></i>
                Record New Goods Issue
              </h5>
            </div>
            <div className="card-body">
              {/* Success Alert */}
              {showSuccess && (
                <div className="alert alert-success alert-dismissible fade show" role="alert">
                  <i className="bi bi-check-circle me-2"></i>
                  Goods issue recorded successfully!
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowSuccess(false)}
                  ></button>
                </div>
              )}

              {/* Error Alert */}
              {formErrors.submit && (
                <div className="alert alert-danger" role="alert">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  {formErrors.submit}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* Item Selection */}
                <div className="mb-3">
                  <label htmlFor="item" className="form-label">
                    Select Item <span className="text-danger">*</span>
                  </label>
                  <select
                    className={`form-select ${formErrors.item ? 'is-invalid' : ''}`}
                    id="item"
                    name="item"
                    value={formData.item}
                    onChange={handleInputChange}
                    disabled={creating}
                  >
                    <option value="">Choose an item...</option>
                    {items.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({item.category_name}) - Available: {item.current_stock} {item.unit}
                      </option>
                    ))}
                  </select>
                  {formErrors.item && (
                    <div className="invalid-feedback">{formErrors.item}</div>
                  )}
                  
                  {/* Item Details Card */}
                  {selectedItem && (
                    <div className={`card mt-2 ${availableStock <= 10 ? 'border-warning' : 'bg-light'}`}>
                      <div className="card-body p-2">
                        <small>
                          <strong>Category:</strong> {selectedItem.category_name} <br />
                          <strong>Available Stock:</strong> 
                          <span className={availableStock <= 10 ? 'text-warning fw-bold' : ''}>
                            {' '}{availableStock} {selectedItem.unit}
                          </span>
                          {availableStock <= 10 && (
                            <span className="badge bg-warning text-dark ms-2">Low Stock</span>
                          )}
                          <br />
                          <strong>Unit:</strong> {selectedItem.unit}
                        </small>
                      </div>
                    </div>
                  )}

                  {/* Out of Stock Warning */}
                  {selectedItem && availableStock === 0 && (
                    <div className="alert alert-danger mt-2 py-2" role="alert">
                      <small>
                        <i className="bi bi-exclamation-triangle me-1"></i>
                        This item is out of stock!
                      </small>
                    </div>
                  )}
                </div>

                {/* Quantity */}
                <div className="mb-3">
                  <label htmlFor="quantity" className="form-label">
                    Quantity <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <input
                      type="number"
                      className={`form-control ${formErrors.quantity || isOverStock ? 'is-invalid' : ''}`}
                      id="quantity"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleInputChange}
                      placeholder="Enter quantity"
                      step="0.01"
                      min="0.01"
                      disabled={creating || !selectedItem || availableStock === 0}
                    />
                    {selectedItem && (
                      <span className="input-group-text">{selectedItem.unit}</span>
                    )}
                    {formErrors.quantity && (
                      <div className="invalid-feedback">{formErrors.quantity}</div>
                    )}
                  </div>
                  
                  {/* Overstock Warning */}
                  {isOverStock && (
                    <small className="text-danger">
                      <i className="bi bi-exclamation-triangle me-1"></i>
                      Exceeds available stock by {(parseFloat(formData.quantity) - availableStock).toFixed(2)} {selectedItem.unit}
                    </small>
                  )}

                  {/* New Stock Preview */}
                  {selectedItem && formData.quantity > 0 && !isOverStock && (
                    <small className="text-danger">
                      <i className="bi bi-arrow-right me-1"></i>
                      New stock will be: {(availableStock - parseFloat(formData.quantity)).toFixed(2)} {selectedItem.unit}
                    </small>
                  )}
                </div>

                {/* Issued To */}
                <div className="mb-3">
                  <label htmlFor="issued_to" className="form-label">
                    Issued To <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className={`form-control ${formErrors.issued_to ? 'is-invalid' : ''}`}
                    id="issued_to"
                    name="issued_to"
                    value={formData.issued_to}
                    onChange={handleInputChange}
                    placeholder="Person or department receiving the items"
                    disabled={creating}
                  />
                  {formErrors.issued_to && (
                    <div className="invalid-feedback">{formErrors.issued_to}</div>
                  )}
                  <small className="text-muted">
                    Example: John Doe, Engineering Dept, Production Line A
                  </small>
                </div>

                {/* Remarks */}
                <div className="mb-3">
                  <label htmlFor="remarks" className="form-label">
                    Remarks / Purpose
                  </label>
                  <textarea
                    className="form-control"
                    id="remarks"
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Optional notes about this issue..."
                    disabled={creating}
                  ></textarea>
                </div>

                {/* Issued By Info */}
                <div className="alert alert-info" role="alert">
                  <small>
                    <strong>Issued by:</strong> {user?.username} ({user?.role})
                  </small>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="btn btn-danger w-100"
                  disabled={creating || !selectedItem || availableStock === 0}
                >
                  {creating ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Recording...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-circle me-2"></i>
                      Record Goods Issue
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* History Section */}
        <div className="col-md-7">
          <div className="card shadow-sm">
            <div className="card-header bg-white">
              <h5 className="mb-0">Recent Goods Issue Transactions</h5>
            </div>
            <div className="card-body">
              {historyLoading ? (
                <div className="text-center py-5">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : goodsIssues.length === 0 ? (
                <div className="text-center py-5">
                  <i className="bi bi-inbox text-muted" style={{ fontSize: '3rem' }}></i>
                  <p className="text-muted mt-3">No goods issue transactions yet.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead>
                      <tr>
                        <th>Date & Time</th>
                        <th>Item</th>
                        <th>Quantity</th>
                        <th>Issued To</th>
                        <th>Issued By</th>
                        <th>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {goodsIssues.slice(0, 20).map((record) => (
                        <tr key={record.id}>
                          <td className="text-muted small">
                            {new Date(record.issued_date).toLocaleDateString()} <br />
                            <small>{new Date(record.issued_date).toLocaleTimeString()}</small>
                          </td>
                          <td>
                            <strong>{record.item_name}</strong>
                          </td>
                          <td>
                            <span className="badge bg-danger fs-6">
                              -{record.quantity}
                            </span>
                          </td>
                          <td>
                            <span className="badge bg-secondary">{record.issued_to}</span>
                          </td>
                          <td>
                            <small>{record.issued_by_username}</small>
                          </td>
                          <td className="text-muted small">
                            {record.remarks || <em>No remarks</em>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {goodsIssues.length > 20 && (
                <div className="text-center mt-3">
                  <small className="text-muted">
                    Showing 20 most recent transactions
                  </small>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoodsIssuePage;
