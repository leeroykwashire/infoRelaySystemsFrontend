import { useState } from 'react';
import { useGetItemsQuery, useGetGoodsReturnsQuery, useGetGoodsIssuesQuery, useCreateGoodsReturnMutation, useDeleteGoodsReturnMutation } from '../services/api';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../features/auth/authSlice';

const GoodsReturnPage = () => {
  const [formData, setFormData] = useState({
    item: '',
    quantity: '',
    original_issue: '',
    reason: '',
    reference_number: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);

  const user = useSelector(selectCurrentUser);

  // Fetch data
  const { data: itemsData } = useGetItemsQuery();
  const { data: goodsReturnsData, isLoading: historyLoading } = useGetGoodsReturnsQuery();
  const { data: goodsIssuesData } = useGetGoodsIssuesQuery();
  
  // Mutation
  const [createGoodsReturn, { isLoading: creating }] = useCreateGoodsReturnMutation();
  const [deleteGoodsReturn] = useDeleteGoodsReturnMutation();

  const items = itemsData?.results || [];
  const goodsReturns = goodsReturnsData?.results || [];
  const goodsIssues = goodsIssuesData?.results || [];

  // Get selected item details
  const selectedItem = items.find(item => item.id.toString() === formData.item);

  // Filter issues for selected item
  const itemIssues = formData.item
    ? goodsIssues.filter(issue => issue.item.toString() === formData.item)
    : [];

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

    if (!formData.reason.trim()) {
      errors.reason = 'Please provide a reason for return';
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
      const payload = {
        item: parseInt(formData.item),
        quantity: parseFloat(formData.quantity),
        reason: formData.reason,
      };

      // Add optional fields if provided
      if (formData.original_issue) {
        payload.original_issue = parseInt(formData.original_issue);
      }
      if (formData.reference_number) {
        payload.reference_number = formData.reference_number;
      }

      await createGoodsReturn(payload).unwrap();

      // Reset form and show success
      setFormData({ item: '', quantity: '', original_issue: '', reason: '', reference_number: '' });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to record goods return:', error);
      setFormErrors({ submit: error.data?.detail || error.data?.quantity?.[0] || 'Failed to record goods return' });
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this return record?')) {
      try {
        await deleteGoodsReturn(id).unwrap();
      } catch (error) {
        console.error('Failed to delete return:', error);
        alert('Failed to delete return record');
      }
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div>
      <h2 className="mb-4">Goods Return</h2>

      <div className="row">
        {/* Form Section */}
        <div className="col-md-5 mb-4">
          <div className="card shadow-sm">
            <div className="card-header bg-warning text-dark">
              <h5 className="mb-0">
                <i className="bi bi-arrow-return-left me-2"></i>
                Record Goods Return
              </h5>
            </div>
            <div className="card-body">
              {/* Success Alert */}
              {showSuccess && (
                <div className="alert alert-success alert-dismissible fade show" role="alert">
                  <i className="bi bi-check-circle me-2"></i>
                  Goods return recorded successfully!
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
                  {formErrors.item && <div className="invalid-feedback d-block">{formErrors.item}</div>}
                </div>

                {/* Quantity Input */}
                <div className="mb-3">
                  <label htmlFor="quantity" className="form-label">
                    Quantity <span className="text-danger">*</span>
                    {selectedItem && <small className="text-muted ms-2">({selectedItem.unit})</small>}
                  </label>
                  <input
                    type="number"
                    className={`form-control ${formErrors.quantity ? 'is-invalid' : ''}`}
                    id="quantity"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    placeholder="Enter quantity to return"
                    step="0.01"
                    min="0"
                    disabled={creating}
                  />
                  {formErrors.quantity && <div className="invalid-feedback">{formErrors.quantity}</div>}
                </div>

                {/* Original Issue Reference (Optional) */}
                <div className="mb-3">
                  <label htmlFor="original_issue" className="form-label">
                    Original Issue Reference <small className="text-muted">(Optional)</small>
                  </label>
                  <select
                    className="form-select"
                    id="original_issue"
                    name="original_issue"
                    value={formData.original_issue}
                    onChange={handleInputChange}
                    disabled={creating || !formData.item}
                  >
                    <option value="">Not linked to specific issue</option>
                    {itemIssues.map((issue) => (
                      <option key={issue.id} value={issue.id}>
                        Issue #{issue.id} - {issue.quantity} {selectedItem?.unit} to {issue.issued_to} ({new Date(issue.issued_date).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                  <small className="text-muted">Link this return to a specific goods issue (if applicable)</small>
                </div>

                {/* Return Reason */}
                <div className="mb-3">
                  <label htmlFor="reason" className="form-label">
                    Reason for Return <span className="text-danger">*</span>
                  </label>
                  <textarea
                    className={`form-control ${formErrors.reason ? 'is-invalid' : ''}`}
                    id="reason"
                    name="reason"
                    value={formData.reason}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Enter reason for return (e.g., excess, unused, damaged)"
                    disabled={creating}
                  ></textarea>
                  {formErrors.reason && <div className="invalid-feedback">{formErrors.reason}</div>}
                </div>

                {/* Reference Number (Optional) */}
                <div className="mb-3">
                  <label htmlFor="reference_number" className="form-label">
                    Reference Number <small className="text-muted">(Optional)</small>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="reference_number"
                    name="reference_number"
                    value={formData.reference_number}
                    onChange={handleInputChange}
                    placeholder="e.g., RTN-2024-001"
                    disabled={creating}
                  />
                  <small className="text-muted">Internal reference or tracking number</small>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="btn btn-warning w-100"
                  disabled={creating}
                >
                  {creating ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Recording...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-arrow-return-left me-2"></i>
                      Record Return
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Returns History Section */}
        <div className="col-md-7">
          <div className="card shadow-sm">
            <div className="card-header bg-warning text-dark">
              <h5 className="mb-0">
                <i className="bi bi-clock-history me-2"></i>
                Returns History
              </h5>
            </div>
            <div className="card-body">
              {historyLoading ? (
                <div className="text-center my-4">
                  <div className="spinner-border text-warning" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : goodsReturns.length === 0 ? (
                <div className="alert alert-info" role="alert">
                  <i className="bi bi-info-circle me-2"></i>
                  No returns recorded yet.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead className="table-warning">
                      <tr>
                        <th>Date</th>
                        <th>Item</th>
                        <th>Quantity</th>
                        <th>Returned By</th>
                        <th>Reason</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {goodsReturns.map((returnItem) => (
                        <tr key={returnItem.id}>
                          <td>{formatDate(returnItem.return_date)}</td>
                          <td>
                            <strong>{returnItem.item_name}</strong>
                            {returnItem.original_issue && (
                              <div className="small text-muted">
                                <i className="bi bi-link-45deg"></i> Issue to: {returnItem.issued_to}
                              </div>
                            )}
                          </td>
                          <td>
                            <span className="badge bg-warning text-dark">
                              {returnItem.quantity} {returnItem.item_unit}
                            </span>
                          </td>
                          <td>{returnItem.returned_by_username}</td>
                          <td>
                            <small>{returnItem.reason}</small>
                            {returnItem.reference_number && (
                              <div className="small text-muted">Ref: {returnItem.reference_number}</div>
                            )}
                          </td>
                          <td>
                            {user?.is_admin && (
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDelete(returnItem.id)}
                                title="Delete return"
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoodsReturnPage;
