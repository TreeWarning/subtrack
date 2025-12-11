import React, { useState, useEffect } from 'react';
import axios from 'axios';

const MonthlyDashboard = () => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Current date state - could be expanded to allow navigation in the future
    const [currentDate] = useState(new Date());

    // Inline Editing State
    const [editingId, setEditingId] = useState(null);
    const [editAmount, setEditAmount] = useState('');

    // Helper to format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    // Helper to format date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString();
    };

    const fetchPayments = async () => {
        setLoading(true);
        setError(null);
        try {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth() + 1; // getMonth is 0-indexed

            const response = await axios.get(`/api/payments/month/${year}/${month}`);
            setPayments(response.data);
        } catch (err) {
            console.error('Error fetching payments:', err);
            setError('Failed to load payments. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayments();
    }, [currentDate]);

    const handleTogglePaid = async (paymentId, currentStatus) => {
        try {
            await axios.put(`/api/payments/${paymentId}/paid`, {
                is_paid: !currentStatus
            });
            // Refresh data to reflect changes and update totals
            fetchPayments();
        } catch (err) {
            console.error('Error updating payment status:', err);
            alert('Failed to update payment status.');
        }
    };

    // Inline Editing Handlers
    const handleEditClick = (payment) => {
        setEditingId(payment.payment_id);
        setEditAmount(payment.amount_due);
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditAmount('');
    };

    const handleSaveAmount = async (paymentId) => {
        try {
            await axios.put(`/api/payments/${paymentId}/amount`, {
                amount_due: editAmount
            });
            setEditingId(null);
            setEditAmount('');
            fetchPayments();
        } catch (err) {
            console.error('Error updating payment amount:', err);
            alert('Failed to update payment amount.');
        }
    };

    // Calculate totals
    const totalDue = payments.reduce((sum, payment) => sum + Number(payment.amount_due), 0);
    const totalPaid = payments
        .filter(payment => payment.is_paid)
        .reduce((sum, payment) => sum + Number(payment.amount_due), 0);
    const remainingDue = totalDue - totalPaid;

    if (loading) return <div className="p-4">Loading dashboard...</div>;
    if (error) return <div className="p-4 text-red-500">{error}</div>;

    const monthName = currentDate.toLocaleString('default', { month: 'long' });
    const year = currentDate.getFullYear();

    return (
        <div className="container mx-auto p-6">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Monthly Dashboard</h1>
                <h2 className="text-xl text-gray-600">{monthName} {year}</h2>
            </header>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
                    <h3 className="text-gray-500 text-sm font-uppercase tracking-wider">Total Monthly Due</h3>
                    <p className="text-2xl font-bold text-gray-800 mt-2">{formatCurrency(totalDue)}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
                    <h3 className="text-gray-500 text-sm font-uppercase tracking-wider">Total Paid</h3>
                    <p className="text-2xl font-bold text-gray-800 mt-2">{formatCurrency(totalPaid)}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-500">
                    <h3 className="text-gray-500 text-sm font-uppercase tracking-wider">Remaining Due</h3>
                    <p className="text-2xl font-bold text-gray-800 mt-2">{formatCurrency(remainingDue)}</p>
                </div>
            </div>

            {/* Payments Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subscription</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {payments.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                                    No payments found for this month.
                                </td>
                            </tr>
                        ) : (
                            payments.map((payment) => (
                                <tr key={payment.payment_id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {payment.subscription_name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {payment.category || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {formatDate(payment.due_date)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                                        {editingId === payment.payment_id ? (
                                            <div className="flex items-center space-x-2">
                                                <input
                                                    type="number"
                                                    value={editAmount}
                                                    onChange={(e) => setEditAmount(e.target.value)}
                                                    className="w-24 p-1 border rounded text-sm"
                                                    step="0.01"
                                                />
                                                <button
                                                    onClick={() => handleSaveAmount(payment.payment_id)}
                                                    className="text-green-600 hover:text-green-800 text-xs font-bold"
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    onClick={handleCancelEdit}
                                                    className="text-red-600 hover:text-red-800 text-xs"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col">
                                                <div className="flex items-center space-x-2">
                                                    <span>{formatCurrency(payment.amount_due)}</span>
                                                    <button
                                                        onClick={() => handleEditClick(payment)}
                                                        className="text-gray-400 hover:text-blue-600"
                                                        title="Edit Amount"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                        </svg>
                                                    </button>
                                                </div>
                                                {payment.trial_end_date && new Date() < new Date(payment.trial_end_date) && (
                                                    <div className="mt-1">
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                                            Trial Ends Soon!
                                                        </span>
                                                        {payment.renewal_price && (
                                                            <span className="text-xs text-gray-500 ml-1">
                                                                (Renews: {formatCurrency(payment.renewal_price)})
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${payment.is_paid
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                            }`}>
                                            {payment.is_paid ? 'Paid' : 'Unpaid'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button
                                            onClick={() => handleTogglePaid(payment.payment_id, payment.is_paid)}
                                            className={`text-white font-bold py-1 px-3 rounded text-xs transition duration-150 ${payment.is_paid
                                                ? 'bg-yellow-500 hover:bg-yellow-600'
                                                : 'bg-blue-600 hover:bg-blue-700'
                                                }`}
                                        >
                                            {payment.is_paid ? 'Mark Unpaid' : 'Mark Paid'}
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MonthlyDashboard;
