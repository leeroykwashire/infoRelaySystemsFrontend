import { useState } from 'react';
import { useGetItemsQuery, useGetGoodsReceivedQuery, useCreateGoodsReceivedMutation } from '../services/api';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../features/auth/authSlice';

const GoodsReceivedPage = () => {
  const [formData, setFormData] = useState({
    item: '',
    quantity: '',
    remarks: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);

  const user = useSelector(selectCurrentUser);

  // Fetch data
  const { data: itemsData } = useGetItemsQuery();
  const { data: goodsReceivedData, isLoading: historyLoading } = useGetGoodsReceivedQuery();
  
  // Mutation
  const [createGoodsReceived, { isLoading: creating }] = useCreateGoodsReceivedMutation();

  const items = itemsData?.results || [];
  const goodsReceived = goodsReceivedData?.results || [];

  // Get selected item details
  const selectedItem = items.find(item => item.id.toString() === formData.item);

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
      await createGoodsReceived({
        item: parseInt(formData.item),
        quantity: parseFloat(formData.quantity),
        remarks: formData.remarks,
      }).unwrap();

      // Reset form and show success
      setFormData({ item: '', quantity: '', remarks: '' });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to record goods received:', error);
      setFormErrors({ submit: error.data?.detail || 'Failed to record goods received' });
    }
  };

  return (
    <div>
      <h2 className="mb-4">Goods Received (Stock IN)</h2>

      <div className="row">
        {/* Form Section */}
        <div className="col-md-5 mb-4">
          <div className="card shadow-sm">
            <div className="card-header bg-success text-white">
              <h5 className="mb-0">
                <i className="bi bi-plus-circle me-2"></i>
                Record New Goods Received
              </h5>
            </div>
            <div className="card-body">
              {/* Success Alert */}
              {showSuccess && (
                <div className="alert alert-success alert-dismissible fade show" role="alert">
                  <i className="bi bi-check-circle me-2"></i>
                  Goods received recorded successfully!
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
                        {item.name} ({item.category_name}) - Current: {item.current_stock} {item.unit}
                      </option>
                    ))}
                  </select>
                  {formErrors.item && (
                    <div className="invalid-feedback">{formErrors.item}</div>
                  )}
                  
                  {/* Item Details Card */}
                  {selectedItem && (
                    <div className="card mt-2 bg-light">
                      <div className="card-body p-2">
                        <small>
                          <strong>Category:</strong> {selectedItem.category_name} <br />
                          <strong>Current Stock:</strong> {selectedItem.current_stock} {selectedItem.unit} <br />
                          <strong>Unit:</strong> {selectedItem.unit}
                        </small>
                      </div>
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
                      className={`form-control ${formErrors.quantity ? 'is-invalid' : ''}`}
                      id="quantity"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleInputChange}
                      placeholder="Enter quantity"
                      step="0.01"
                      min="0.01"
                      disabled={creating}
                    />
                    {selectedItem && (
                      <span className="input-group-text">{selectedItem.unit}</span>
                    )}
                    {formErrors.quantity && (
                      <div className="invalid-feedback">{formErrors.quantity}</div>
                    )}
                  </div>
                  
                  {/* New Stock Preview */}
                  {selectedItem && formData.quantity > 0 && (
                    <small className="text-success">
                      <i className="bi bi-arrow-right me-1"></i>
                      New stock will be: {parseFloat(selectedItem.current_stock) + parseFloat(formData.quantity)} {selectedItem.unit}
                    </small>
                  )}
                </div>

                {/* Remarks */}
                <div className="mb-3">
                  <label htmlFor="remarks" className="form-label">
                    Remarks / Notes
                  </label>
                  <textarea
                    className="form-control"
                    id="remarks"
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Optional notes about this receipt..."
                    disabled={creating}
                  ></textarea>
                </div>

                {/* Received By Info */}
                <div className="alert alert-info" role="alert">
                  <small>
                    <strong>Received by:</strong> {user?.username} ({user?.role})
                  </small>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="btn btn-success w-100"
                  disabled={creating}
                >
                  {creating ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Recording...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-circle me-2"></i>
                      Record Goods Received
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
              <h5 className="mb-0">Recent Goods Received Transactions</h5>
            </div>
            <div className="card-body">
              {historyLoading ? (
                <div className="text-center py-5">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : goodsReceived.length === 0 ? (
                <div className="text-center py-5">
                  <i className="bi bi-inbox text-muted" style={{ fontSize: '3rem' }}></i>
                  <p className="text-muted mt-3">No goods received transactions yet.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead>
                      <tr>
                        <th>Date & Time</th>
                        <th>Item</th>
                        <th>Quantity</th>
                        <th>Received By</th>
                        <th>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {goodsReceived.slice(0, 20).map((record) => (
                        <tr key={record.id}>
                          <td className="text-muted small">
                            {new Date(record.received_date).toLocaleDateString()} <br />
                            <small>{new Date(record.received_date).toLocaleTimeString()}</small>
                          </td>
                          <td>
                            <strong>{record.item_name}</strong>
                          </td>
                          <td>
                            <span className="badge bg-success fs-6">
                              +{record.quantity}
                            </span>
                          </td>
                          <td>
                            <small>{record.received_by_username}</small>
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

              {goodsReceived.length > 20 && (
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

export default GoodsReceivedPage;
