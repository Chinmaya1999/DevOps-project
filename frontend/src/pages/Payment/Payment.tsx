import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, CreditCard, Calendar, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { api } from '../../services/api';

interface PaymentConfig {
  upiId: string;
  upiQRCode: string;
  bankDetails: {
    accountName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
  };
  pricing: {
    monthly: number;
    yearly: number;
  };
}

const Payment: React.FC = () => {
  const navigate = useNavigate();
  const [config, setConfig] = useState<PaymentConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [subscriptionType, setSubscriptionType] = useState<'monthly' | 'yearly'>('monthly');
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'bank_transfer'>('upi');
  const [transactionId, setTransactionId] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchPaymentConfig();
  }, []);

  const fetchPaymentConfig = async () => {
    try {
      const response = await api.get('/payment/config');
      setConfig(response.data.data);
    } catch (err) {
      console.error('Failed to fetch payment config:', err);
      setError('Failed to load payment configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setScreenshot(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    if (!transactionId.trim()) {
      setError('Transaction ID is required');
      setSubmitting(false);
      return;
    }

    if (!screenshot) {
      setError('Please upload payment screenshot');
      setSubmitting(false);
      return;
    }

    const formData = new FormData();
    formData.append('paymentMethod', paymentMethod);
    formData.append('transactionId', transactionId);
    formData.append('subscriptionType', subscriptionType);
    formData.append('screenshot', screenshot);
    if (notes) formData.append('notes', notes);

    try {
      await api.post('/payment/submit', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit payment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading payment information...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Payment Submitted!</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Your payment has been submitted successfully. We will verify it and activate your subscription shortly.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </button>

        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Upgrade to Premium
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Unlock all features and take your DevOps workflow to the next level
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Pricing Cards */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Monthly</h3>
              <Calendar className="w-6 h-6 text-indigo-600" />
            </div>
            <div className="mb-6">
              <span className="text-4xl font-bold text-gray-900 dark:text-white">₹{config?.pricing.monthly}</span>
              <span className="text-gray-600 dark:text-gray-400">/month</span>
            </div>
            <button
              onClick={() => setSubscriptionType('monthly')}
              className={`w-full py-3 rounded-xl font-semibold transition-all ${
                subscriptionType === 'monthly'
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {subscriptionType === 'monthly' ? 'Selected' : 'Select Monthly'}
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border-2 border-indigo-600 relative">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-indigo-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
              Popular
            </div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Yearly</h3>
              <CreditCard className="w-6 h-6 text-indigo-600" />
            </div>
            <div className="mb-6">
              <span className="text-4xl font-bold text-gray-900 dark:text-white">₹{config?.pricing.yearly}</span>
              <span className="text-gray-600 dark:text-gray-400">/year</span>
              <div className="text-sm text-green-600 dark:text-green-400 mt-2">Save 17%</div>
            </div>
            <button
              onClick={() => setSubscriptionType('yearly')}
              className={`w-full py-3 rounded-xl font-semibold transition-all ${
                subscriptionType === 'yearly'
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {subscriptionType === 'yearly' ? 'Selected' : 'Select Yearly'}
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Payment Details */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Payment Details</h2>

            {/* Payment Method Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Payment Method
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setPaymentMethod('upi')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    paymentMethod === 'upi'
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600'
                  }`}
                >
                  <div className="text-center">
                    <CreditCard className="w-8 h-8 mx-auto mb-2 text-indigo-600" />
                    <span className="font-medium text-gray-900 dark:text-white">UPI</span>
                  </div>
                </button>
                <button
                  onClick={() => setPaymentMethod('bank_transfer')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    paymentMethod === 'bank_transfer'
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600'
                  }`}
                >
                  <div className="text-center">
                    <CreditCard className="w-8 h-8 mx-auto mb-2 text-indigo-600" />
                    <span className="font-medium text-gray-900 dark:text-white">Bank Transfer</span>
                  </div>
                </button>
              </div>
            </div>

            {/* UPI Details */}
            {paymentMethod === 'upi' && config && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  UPI QR Code
                </label>
                <div className="bg-white dark:bg-gray-700 rounded-xl p-4 flex items-center justify-center mb-4">
                  <img src={config.upiQRCode} alt="UPI QR Code" className="w-48 h-48" />
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">UPI ID:</p>
                  <p className="text-lg font-mono font-semibold text-gray-900 dark:text-white">{config.upiId}</p>
                </div>
              </div>
            )}

            {/* Bank Details */}
            {paymentMethod === 'bank_transfer' && config && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Bank Account Details
                </label>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Account Name:</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{config.bankDetails.accountName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Account Number:</p>
                    <p className="font-mono font-semibold text-gray-900 dark:text-white">{config.bankDetails.accountNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">IFSC Code:</p>
                    <p className="font-mono font-semibold text-gray-900 dark:text-white">{config.bankDetails.ifscCode}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Bank Name:</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{config.bankDetails.bankName}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Payment Form */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Submit Payment</h2>

            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 mr-3 flex-shrink-0" />
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Transaction ID *
                </label>
                <input
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="Enter your transaction ID"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Payment Screenshot *
                </label>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-indigo-600 dark:hover:border-indigo-400 transition-colors">
                  <input
                    type="file"
                    id="screenshot"
                    onChange={handleFileChange}
                    accept="image/*,.pdf"
                    className="hidden"
                    required
                  />
                  <label htmlFor="screenshot" className="cursor-pointer">
                    <Upload className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-300 mb-2">
                      {screenshot ? screenshot.name : 'Click to upload or drag and drop'}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      PNG, JPG, GIF, PDF up to 5MB
                    </p>
                  </label>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional notes..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {submitting ? 'Submitting...' : 'Submit Payment'}
              </button>
            </form>

            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Note:</strong> Your payment will be verified manually. Once verified, your premium subscription will be activated immediately.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;
