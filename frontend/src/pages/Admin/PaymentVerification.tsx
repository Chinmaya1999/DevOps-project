import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Eye, Filter, Search } from 'lucide-react';
import { api } from '../../services/api';

interface Payment {
  _id: string;
  user: {
    _id: string;
    username: string;
    email: string;
  };
  amount: number;
  paymentMethod: string;
  transactionId: string;
  screenshotUrl: string;
  status: 'pending' | 'verified' | 'rejected';
  subscriptionType: string;
  notes?: string;
  rejectionReason?: string;
  createdAt: string;
  verifiedBy?: {
    username: string;
    email: string;
  };
  verifiedAt?: string;
}

interface UserSubscription {
  _id: string;
  username: string;
  email: string;
  subscription: {
    type: string;
    startDate?: string;
    endDate?: string;
    trialEndDate?: string;
    subscriptionType?: string;
  };
}

interface PaymentStats {
  total: number;
  pending: number;
  verified: number;
  rejected: number;
  totalRevenue: number;
  recentPayments: Payment[];
}

const PaymentVerification: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null);

  useEffect(() => {
    fetchPayments();
    fetchStats();
  }, [filter]);

  const fetchPayments = async () => {
    try {
      const response = await api.get('/payment/all', {
        params: filter !== 'all' ? { status: filter } : {}
      });
      setPayments(response.data.data);
    } catch (error) {
      console.error('Failed to fetch payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/payment/stats');
      setStats(response.data.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchUserSubscription = async (userId: string) => {
    try {
      const response = await api.get(`/admin/users/${userId}`);
      setUserSubscription(response.data.data);
    } catch (error) {
      console.error('Failed to fetch user subscription:', error);
    }
  };

  const handleMakePremium = async (userId: string) => {
    try {
      await api.put(`/admin/users/${userId}`, {
        subscription: {
          type: 'premium',
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          subscriptionType: 'yearly'
        }
      });
      alert('User upgraded to premium successfully');
      if (selectedPayment) {
        fetchUserSubscription(selectedPayment.user._id);
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to upgrade user to premium');
    }
  };

  const handleVerify = async (paymentId: string, action: 'approve' | 'reject') => {
    if (action === 'reject' && !rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    setProcessing(true);
    try {
      await api.put(`/payment/verify/${paymentId}`, {
        action,
        rejectionReason: action === 'reject' ? rejectionReason : undefined
      });

      setShowModal(false);
      setRejectionReason('');
      setSelectedPayment(null);
      fetchPayments();
      fetchStats();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to verify payment');
    } finally {
      setProcessing(false);
    }
  };

  const openModal = (payment: Payment) => {
    setSelectedPayment(payment);
    setShowModal(true);
    setRejectionReason('');
    fetchUserSubscription(payment.user._id);
  };

  const filteredPayments = payments.filter(payment =>
    payment.user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    payment.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    payment.transactionId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'verified':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Payment Verification</h1>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-2">Total Payments</h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-2">Pending</h3>
              <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pending}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-2">Verified</h3>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.verified}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-2">Total Revenue</h3>
              <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">₹{stats.totalRevenue.toLocaleString()}</p>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-600"
              >
                <option value="all">All Payments</option>
                <option value="pending">Pending</option>
                <option value="verified">Verified</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by username, email, or transaction ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-600"
              />
            </div>
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Transaction ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredPayments.map((payment) => (
                  <tr key={payment._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{payment.user.username}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{payment.user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-white">₹{payment.amount}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{payment.subscriptionType}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-900 dark:text-white capitalize">{payment.paymentMethod.replace('_', ' ')}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm text-gray-900 dark:text-white">{payment.transactionId}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openModal(payment)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        {payment.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleVerify(payment._id, 'approve')}
                              className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                              title="Approve"
                            >
                              <CheckCircle className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedPayment(payment);
                                setShowModal(true);
                              }}
                              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                              title="Reject"
                            >
                              <XCircle className="w-5 h-5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredPayments.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">No payments found</p>
            </div>
          )}
        </div>

        {/* Payment Details Modal */}
        {showModal && selectedPayment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Payment Details</h2>
              </div>

              <div className="p-6 space-y-6">
                {/* User Info */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">User Information</h3>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <p className="text-gray-900 dark:text-white font-medium">{selectedPayment.user.username}</p>
                    <p className="text-gray-600 dark:text-gray-300">{selectedPayment.user.email}</p>
                  </div>
                </div>

                {/* User Subscription Info */}
                {userSubscription && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Subscription Status</h3>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">Type:</span>
                        <span className={`font-medium capitalize ${
                          userSubscription.subscription.type === 'premium' ? 'text-green-600 dark:text-green-400' :
                          userSubscription.subscription.type === 'trial' ? 'text-blue-600 dark:text-blue-400' :
                          'text-gray-900 dark:text-white'
                        }`}>
                          {userSubscription.subscription.type}
                        </span>
                      </div>
                      {userSubscription.subscription.startDate && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-300">Start Date:</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {new Date(userSubscription.subscription.startDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {userSubscription.subscription.trialEndDate && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-300">Trial End Date:</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {new Date(userSubscription.subscription.trialEndDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {userSubscription.subscription.endDate && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-300">End Date:</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {new Date(userSubscription.subscription.endDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {userSubscription.subscription.subscriptionType && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-300">Plan:</span>
                          <span className="font-medium text-gray-900 dark:text-white capitalize">
                            {userSubscription.subscription.subscriptionType}
                          </span>
                        </div>
                      )}
                    </div>
                    {userSubscription.subscription.type !== 'premium' && (
                      <button
                        onClick={() => handleMakePremium(selectedPayment.user._id)}
                        className="mt-3 w-full py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
                      >
                        Make Premium
                      </button>
                    )}
                  </div>
                )}

                {/* Payment Info */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Payment Information</h3>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Amount:</span>
                      <span className="font-medium text-gray-900 dark:text-white">₹{selectedPayment.amount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Subscription:</span>
                      <span className="font-medium text-gray-900 dark:text-white capitalize">{selectedPayment.subscriptionType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Method:</span>
                      <span className="font-medium text-gray-900 dark:text-white capitalize">{selectedPayment.paymentMethod.replace('_', ' ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Transaction ID:</span>
                      <span className="font-mono font-medium text-gray-900 dark:text-white">{selectedPayment.transactionId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Status:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedPayment.status)}`}>
                        {selectedPayment.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Screenshot */}
                {selectedPayment.screenshotUrl && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Payment Screenshot</h3>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <img
                        src={selectedPayment.screenshotUrl}
                        alt="Payment Screenshot"
                        className="max-w-full h-auto rounded-lg"
                      />
                    </div>
                  </div>
                )}

                {/* Notes */}
                {selectedPayment.notes && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Notes</h3>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <p className="text-gray-900 dark:text-white">{selectedPayment.notes}</p>
                    </div>
                  </div>
                )}

                {/* Rejection Reason */}
                {selectedPayment.rejectionReason && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Rejection Reason</h3>
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                      <p className="text-red-800 dark:text-red-200">{selectedPayment.rejectionReason}</p>
                    </div>
                  </div>
                )}

                {/* Verification Info */}
                {selectedPayment.status !== 'pending' && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Verification Information</h3>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">Verified By:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{selectedPayment.verifiedBy?.username}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">Verified At:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {selectedPayment.verifiedAt ? new Date(selectedPayment.verifiedAt).toLocaleString() : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions for Pending Payments */}
                {selectedPayment.status === 'pending' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Rejection Reason (if rejecting)
                      </label>
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Enter reason for rejection..."
                        rows={3}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-600 resize-none"
                      />
                    </div>

                    <div className="flex gap-4">
                      <button
                        onClick={() => handleVerify(selectedPayment._id, 'approve')}
                        disabled={processing}
                        className="flex-1 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-5 h-5" />
                        Approve Payment
                      </button>
                      <button
                        onClick={() => handleVerify(selectedPayment._id, 'reject')}
                        disabled={processing}
                        className="flex-1 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <XCircle className="w-5 h-5" />
                        Reject Payment
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedPayment(null);
                    setRejectionReason('');
                  }}
                  className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentVerification;
