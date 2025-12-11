import React, { useState, useEffect } from 'react';
import axios from 'axios';

const SubscriptionManager = () => {
    const [subscriptions, setSubscriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        category: '',
        default_price: '',
        is_variable: false,
        billing_cycle: 'Monthly',
        start_date: '',
        renewal_price: '',
        trial_end_date: ''
    });

    const fetchSubscriptions = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/subscriptions');
            setSubscriptions(response.data);
            setError(null);
        } catch (err) {
            console.error('Error fetching subscriptions:', err);
            setError('Failed to load subscriptions.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubscriptions();
    }, []);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        // --- FIX: Clean up form data before sending to backend ---
        // Convert empty strings for NUMERIC and DATE fields to null
        const dataToSend = {
            ...formData,
            default_price: formData.default_price === '' ? null : Number(formData.default_price),
            renewal_price: formData.renewal_price === '' ? null : Number(formData.renewal_price),
            trial_end_date: formData.trial_end_date === '' ? null : formData.trial_end_date
        };


        try {
            // 1. Create the subscription
            // Use dataToSend which has cleaned up null values
            const subResponse = await axios.post('/api/subscriptions', dataToSend);
            const newSubscription = subResponse.data;

            // 2. Generate the first payment record immediately
            const initialAmount = dataToSend.default_price ? parseFloat(dataToSend.default_price) : 0;

            await axios.post('/api/payments', {
                subscription_id: newSubscription.subscription_id,
                due_date: dataToSend.start_date,
                amount_due: initialAmount,
                is_paid: false
            });

            // 3. Reset form and refresh list
            setFormData({
                name: '',
                category: '',
                default_price: '',
                is_variable: false,
                billing_cycle: 'Monthly',
                start_date: '',
                renewal_price: '',
                trial_end_date: ''
            });
            fetchSubscriptions();
            alert('Subscription and initial payment created successfully!');

        } catch (err) {
            console.error('Error creating subscription:', err);
            // This error is crucial for debugging the DB issue
            setError('Failed to create subscription. Check console for details.');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this subscription? All related payments will also be deleted.')) {
            return;
        }

        try {
            await axios.delete(`/api/subscriptions/${id}`);
            fetchSubscriptions();
        } catch (err) {
            console.error('Error deleting subscription:', err);
            alert('Failed to delete subscription.');
        }
    };

    const handleEdit = (id) => {
        console.log('Edit clicked for subscription:', id);
        // Placeholder for future edit modal implementation
        alert(`Edit functionality for ID ${id} coming soon!`);
    };

    // Helper to format currency
    const formatCurrency = (amount) => {
        if (amount === null || amount === undefined || amount === '') return '-';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Subscription Manager</h1>
                    <p className="text-slate-500 mt-2">Manage your recurring expenses and subscriptions.</p>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-r-lg shadow-sm flex items-center" role="alert">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                    <p>{error}</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Add New Subscription Form */}
                <div className="lg:col-span-4">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden sticky top-24">
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                                Add Subscription
                            </h2>
                        </div>
                        <div className="p-6">
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Service Name *</label>
                                    <input
                                        type="text"
                                        name="name"
                                        required
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        placeholder="e.g. Netflix"
                                        className="block w-full rounded-lg border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition-colors duration-200 p-2.5"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                                    <input
                                        type="text"
                                        name="category"
                                        value={formData.category}
                                        onChange={handleInputChange}
                                        placeholder="e.g. Entertainment"
                                        className="block w-full rounded-lg border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition-colors duration-200 p-2.5"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Price</label>
                                        <div className="relative rounded-md shadow-sm">
                                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                                <span className="text-slate-500 sm:text-sm">$</span>
                                            </div>
                                            <input
                                                type="number"
                                                step="0.01"
                                                name="default_price"
                                                value={formData.default_price}
                                                onChange={handleInputChange}
                                                className="block w-full rounded-lg border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-indigo-500 pl-7 sm:text-sm transition-colors duration-200 p-2.5"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Billing Cycle</label>
                                        <select
                                            name="billing_cycle"
                                            value={formData.billing_cycle}
                                            onChange={handleInputChange}
                                            className="block w-full rounded-lg border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition-colors duration-200 p-2.5"
                                        >
                                            <option value="Monthly">Monthly</option>
                                            <option value="Quarterly">Quarterly</option>
                                            <option value="Annually">Annually</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex items-center">
                                    <input
                                        id="is_variable"
                                        type="checkbox"
                                        name="is_variable"
                                        checked={formData.is_variable}
                                        onChange={handleInputChange}
                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
                                    />
                                    <label htmlFor="is_variable" className="ml-2 block text-sm text-slate-700 cursor-pointer">
                                        Variable Price?
                                    </label>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Start Date *</label>
                                    <input
                                        type="date"
                                        name="start_date"
                                        required
                                        value={formData.start_date}
                                        onChange={handleInputChange}
                                        className="block w-full rounded-lg border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition-colors duration-200 p-2.5"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 transform hover:scale-[1.02]"
                                >
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                                    Add Subscription
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Subscriptions List */}
                <div className="lg:col-span-8">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h2 className="text-lg font-semibold text-slate-800">Active Subscriptions</h2>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                {subscriptions.length} Total
                            </span>
                        </div>

                        {loading ? (
                            <div className="p-12 text-center">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                                <p className="text-slate-500">Loading subscriptions...</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-200">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Price</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Cycle</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Next Renewal</th>
                                            <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-slate-200">
                                        {subscriptions.length === 0 ? (
                                            <tr>
                                                <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                                                    <div className="flex flex-col items-center justify-center">
                                                        <svg className="w-12 h-12 text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                                                        <p className="text-lg font-medium text-slate-900">No subscriptions yet</p>
                                                        <p className="text-sm text-slate-500">Add your first subscription to get started.</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            subscriptions.map((sub) => (
                                                <tr key={sub.subscription_id} className="hover:bg-slate-50/80 transition-colors duration-150 group">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-semibold text-slate-900">{sub.name}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                                                            {sub.category || 'Uncategorized'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-slate-900">
                                                            {sub.is_variable ? (
                                                                <span className="text-slate-500 italic">Variable</span>
                                                            ) : (
                                                                formatCurrency(sub.default_price)
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                        {sub.billing_cycle}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                        {new Date(sub.start_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                            <button
                                                                onClick={() => handleEdit(sub.subscription_id)}
                                                                className="text-indigo-600 hover:text-indigo-900 p-1 hover:bg-indigo-50 rounded"
                                                                title="Edit"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(sub.subscription_id)}
                                                                className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded"
                                                                title="Delete"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubscriptionManager;