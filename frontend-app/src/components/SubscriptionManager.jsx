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

        try {
            // 1. Create the subscription
            const subResponse = await axios.post('/api/subscriptions', formData);
            const newSubscription = subResponse.data;

            // 2. Generate the first payment record immediately
            // If price is variable, we might default to 0 or the default_price if provided
            const initialAmount = formData.default_price ? parseFloat(formData.default_price) : 0;

            await axios.post('/api/payments', {
                subscription_id: newSubscription.subscription_id,
                due_date: formData.start_date,
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
            setError('Failed to create subscription. Please try again.');
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
        <div className="container mx-auto p-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">Subscription Manager</h1>

            {/* Error Message */}
            {error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
                    <p>{error}</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Add New Subscription Form */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-xl font-semibold mb-4 text-gray-700">Add New Subscription</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Service Name *</label>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Category</label>
                                <input
                                    type="text"
                                    name="category"
                                    value={formData.category}
                                    onChange={handleInputChange}
                                    placeholder="e.g. Streaming, Utility"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Default Price</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        name="default_price"
                                        value={formData.default_price}
                                        onChange={handleInputChange}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Billing Cycle</label>
                                    <select
                                        name="billing_cycle"
                                        value={formData.billing_cycle}
                                        onChange={handleInputChange}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                                    >
                                        <option value="Monthly">Monthly</option>
                                        <option value="Quarterly">Quarterly</option>
                                        <option value="Annually">Annually</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="is_variable"
                                        checked={formData.is_variable}
                                        onChange={handleInputChange}
                                        className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                                    />
                                    <span className="text-sm font-medium text-gray-700">Variable Price?</span>
                                </label>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Start Date *</label>
                                <input
                                    type="date"
                                    name="start_date"
                                    required
                                    value={formData.start_date}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Add Subscription
                            </button>
                        </form>
                    </div>
                </div>

                {/* Subscriptions List */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-lg shadow-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-700">Active Subscriptions</h2>
                        </div>

                        {loading ? (
                            <div className="p-6 text-center text-gray-500">Loading subscriptions...</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cycle</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Next Renewal</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {subscriptions.length === 0 ? (
                                            <tr>
                                                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                                                    No subscriptions found. Add one to get started!
                                                </td>
                                            </tr>
                                        ) : (
                                            subscriptions.map((sub) => (
                                                <tr key={sub.subscription_id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {sub.name}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {sub.category || '-'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {sub.is_variable ? 'Variable' : formatCurrency(sub.default_price)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {sub.billing_cycle}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {/* Simple logic for display, real app might calculate next due date */}
                                                        {new Date(sub.start_date).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <button
                                                            onClick={() => handleEdit(sub.subscription_id)}
                                                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(sub.subscription_id)}
                                                            className="text-red-600 hover:text-red-900"
                                                        >
                                                            Delete
                                                        </button>
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
