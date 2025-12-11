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
        return new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
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

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        </div>
    );

    if (error) return (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-r-lg shadow-sm" role="alert">
            <p>{error}</p>
        </div>
    );

    const monthName = currentDate.toLocaleString('default', { month: 'long' });
    const year = currentDate.getFullYear();

    return (
        <div className="max-w-7xl mx-auto">
            <header className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Monthly Dashboard</h1>
                    <p className="text-slate-500 mt-2 text-lg">{monthName} {year}</p>
                </div>
                <div className="flex gap-2">
                    {/* Future: Add month navigation buttons here */}
                </div>
            </header>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden group hover:shadow-md transition-shadow duration-200">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <svg className="w-16 h-16 text-indigo-600" fill="currentColor" viewBox="0 0 20 20"><path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" /><path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" /></svg>
                    </div>
                    <h3 className="text-slate-500 text-sm font-semibold uppercase tracking-wider mb-1">Total Due</h3>
                    <p className="text-3xl font-bold text-slate-900">{formatCurrency(totalDue)}</p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden group hover:shadow-md transition-shadow duration-200">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <svg className="w-16 h-16 text-emerald-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    </div>
                    <h3 className="text-slate-500 text-sm font-semibold uppercase tracking-wider mb-1">Total Paid</h3>
                    <p className="text-3xl font-bold text-emerald-600">{formatCurrency(totalPaid)}</p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden group hover:shadow-md transition-shadow duration-200">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <svg className="w-16 h-16 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                    </div>
                    <h3 className="text-slate-500 text-sm font-semibold uppercase tracking-wider mb-1">Remaining Due</h3>
                    <p className="text-3xl font-bold text-amber-600">{formatCurrency(remainingDue)}</p>
                </div>
            </div>

            {/* Payments Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
                    <h2 className="text-lg font-semibold text-slate-800">Monthly Payments</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Subscription</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Due Date</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {payments.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                                        <div className="flex flex-col items-center justify-center">
                                            <svg className="w-12 h-12 text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                                            <p className="text-lg font-medium text-slate-900">No payments found</p>
                                            <p className="text-sm text-slate-500">No payments scheduled for this month.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                payments.map((payment) => (
                                    <tr key={payment.payment_id} className="hover:bg-slate-50/80 transition-colors duration-150 group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-semibold text-slate-900">{payment.subscription_name}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                                                {payment.category || 'Uncategorized'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                            {formatDate(payment.due_date)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 font-semibold">
                                            {editingId === payment.payment_id ? (
                                                <div className="flex items-center space-x-2 animate-in fade-in duration-200">
                                                    <input
                                                        type="number"
                                                        value={editAmount}
                                                        onChange={(e) => setEditAmount(e.target.value)}
                                                        className="w-24 p-1.5 border border-indigo-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                                        step="0.01"
                                                        autoFocus
                                                    />
                                                    <button
                                                        onClick={() => handleSaveAmount(payment.payment_id)}
                                                        className="text-emerald-600 hover:text-emerald-800 p-1 hover:bg-emerald-50 rounded"
                                                        title="Save"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                    </button>
                                                    <button
                                                        onClick={handleCancelEdit}
                                                        className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded"
                                                        title="Cancel"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col">
                                                    <div className="flex items-center space-x-2 group/edit">
                                                        <span>{formatCurrency(payment.amount_due)}</span>
                                                        <button
                                                            onClick={() => handleEditClick(payment)}
                                                            className="text-slate-400 hover:text-indigo-600 opacity-0 group-hover/edit:opacity-100 transition-opacity duration-200"
                                                            title="Edit Amount"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                    {payment.trial_end_date && new Date() < new Date(payment.trial_end_date) && (
                                                        <div className="mt-1">
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                                                                Trial Ends Soon
                                                            </span>
                                                            {payment.renewal_price && (
                                                                <span className="text-xs text-slate-500 ml-1 block">
                                                                    Renews: {formatCurrency(payment.renewal_price)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${payment.is_paid
                                                ? 'bg-emerald-100 text-emerald-800'
                                                : 'bg-rose-100 text-rose-800'
                                                }`}>
                                                {payment.is_paid ? 'Paid' : 'Unpaid'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button
                                                onClick={() => handleTogglePaid(payment.payment_id, payment.is_paid)}
                                                className={`font-medium py-1.5 px-3 rounded-lg text-xs transition-all duration-200 shadow-sm ${payment.is_paid
                                                    ? 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                                                    : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow'
                                                    }`}
                                            >
                                                {payment.is_paid ? 'Mark Unpaid' : 'Mark as Paid'}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default MonthlyDashboard;
