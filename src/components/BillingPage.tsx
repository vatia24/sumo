import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Download, 
  Eye, 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  DollarSign,
  Calendar,
  Receipt,
  Shield,
  Zap,
  Crown,
  Star,
  TrendingUp,
  Users,
  Settings,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Filter,
  Search
} from 'lucide-react';

interface Invoice {
  id: string;
  number: string;
  date: string;
  dueDate: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue' | 'cancelled';
  description: string;
  items: InvoiceItem[];
}

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'bank';
  last4: string;
  brand: string;
  expiryDate: string;
  isDefault: boolean;
  status: 'active' | 'expired' | 'inactive';
}

interface Subscription {
  id: string;
  plan: string;
  status: 'active' | 'cancelled' | 'past_due' | 'trialing';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  amount: number;
  interval: 'monthly' | 'yearly';
  features: string[];
}

const BillingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [showAddPaymentMethod, setShowAddPaymentMethod] = useState(false);
  const [showInvoiceDetails, setShowInvoiceDetails] = useState<string | null>(null);

  // Mock data
  useEffect(() => {
    const mockInvoices: Invoice[] = [
      {
        id: '1',
        number: 'INV-2024-001',
        date: '2024-01-15',
        dueDate: '2024-02-15',
        amount: 299.00,
        status: 'paid',
        description: 'Pro Plan - Monthly Subscription',
        items: [
          { id: '1', description: 'Pro Plan Subscription', quantity: 1, unitPrice: 299.00, total: 299.00 }
        ]
      },
      {
        id: '2',
        number: 'INV-2024-002',
        date: '2024-02-15',
        dueDate: '2024-03-15',
        amount: 299.00,
        status: 'pending',
        description: 'Pro Plan - Monthly Subscription',
        items: [
          { id: '1', description: 'Pro Plan Subscription', quantity: 1, unitPrice: 299.00, total: 299.00 }
        ]
      },
      {
        id: '3',
        number: 'INV-2024-003',
        date: '2024-03-15',
        dueDate: '2024-04-15',
        amount: 299.00,
        status: 'overdue',
        description: 'Pro Plan - Monthly Subscription',
        items: [
          { id: '1', description: 'Pro Plan Subscription', quantity: 1, unitPrice: 299.00, total: 299.00 }
        ]
      }
    ];

    const mockPaymentMethods: PaymentMethod[] = [
      {
        id: '1',
        type: 'card',
        last4: '4242',
        brand: 'Visa',
        expiryDate: '12/25',
        isDefault: true,
        status: 'active'
      },
      {
        id: '2',
        type: 'card',
        last4: '5555',
        brand: 'Mastercard',
        expiryDate: '08/26',
        isDefault: false,
        status: 'active'
      }
    ];

    const mockSubscription: Subscription = {
      id: '1',
      plan: 'Pro',
      status: 'active',
      currentPeriodStart: '2024-01-15',
      currentPeriodEnd: '2024-02-15',
      amount: 299.00,
      interval: 'monthly',
      features: [
        'Unlimited offers',
        'Advanced analytics',
        'Priority support',
        'Custom branding',
        'API access',
        'Team collaboration'
      ]
    };

    setInvoices(mockInvoices);
    setPaymentMethods(mockPaymentMethods);
    setSubscription(mockSubscription);
  }, []);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: CreditCard },
    { id: 'invoices', label: 'Invoices', icon: Receipt },
    { id: 'payment-methods', label: 'Payment Methods', icon: Shield },
    { id: 'usage', label: 'Usage', icon: TrendingUp }
  ];

  const plans = [
    {
      name: 'Starter',
      price: 99,
      interval: 'month',
      features: ['Up to 100 offers', 'Basic analytics', 'Email support'],
      current: false
    },
    {
      name: 'Pro',
      price: 299,
      interval: 'month',
      features: ['Unlimited offers', 'Advanced analytics', 'Priority support', 'Custom branding'],
      current: true
    },
    {
      name: 'Enterprise',
      price: 999,
      interval: 'month',
      features: ['Everything in Pro', 'API access', 'Team collaboration', 'Dedicated support'],
      current: false
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'overdue': return 'text-red-600 bg-red-100';
      case 'cancelled': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle size={16} />;
      case 'pending': return <Clock size={16} />;
      case 'overdue': return <AlertTriangle size={16} />;
      case 'cancelled': return <XCircle size={16} />;
      default: return <Clock size={16} />;
    }
  };

  const getSubscriptionStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      case 'past_due': return 'text-yellow-600 bg-yellow-100';
      case 'trialing': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Current Subscription */}
      {subscription && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Current Subscription</h2>
              <p className="text-gray-600">Manage your subscription and billing</p>
            </div>
            <button className="flex items-center space-x-2 text-blue-600 hover:text-blue-700">
              <Settings size={16} />
              <span>Manage</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-500 p-2 rounded-lg">
                    <Crown size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{subscription.plan} Plan</h3>
                    <p className="text-sm text-gray-600">${subscription.amount}/{subscription.interval}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getSubscriptionStatusColor(subscription.status)}`}>
                  {subscription.status.replace('_', ' ')}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">Current Period</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(subscription.currentPeriodStart).toLocaleDateString()} - {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Next Billing</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-900">Plan Features:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {subscription.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <CheckCircle size={14} className="text-green-500" />
                      <span className="text-sm text-gray-600">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Quick Actions</h4>
                <div className="space-y-2">
                  <button className="w-full text-left text-sm text-blue-600 hover:text-blue-700">
                    Upgrade Plan
                  </button>
                  <button className="w-full text-left text-sm text-blue-600 hover:text-blue-700">
                    Download Invoice
                  </button>
                  <button className="w-full text-left text-sm text-blue-600 hover:text-blue-700">
                    Update Payment Method
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Billing Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Spent</p>
              <p className="text-2xl font-bold text-gray-900">$897</p>
            </div>
            <div className="bg-green-500 p-3 rounded-lg">
              <DollarSign size={20} className="text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-gray-900">$299</p>
            </div>
            <div className="bg-blue-500 p-3 rounded-lg">
              <Calendar size={20} className="text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Invoices</p>
              <p className="text-2xl font-bold text-gray-900">12</p>
            </div>
            <div className="bg-purple-500 p-3 rounded-lg">
              <Receipt size={20} className="text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Payment Methods</p>
              <p className="text-2xl font-bold text-gray-900">2</p>
            </div>
            <div className="bg-orange-500 p-3 rounded-lg">
              <CreditCard size={20} className="text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Invoices */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Invoices</h3>
          <button className="text-blue-600 hover:text-blue-700 text-sm">View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {invoices.slice(0, 3).map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <div className="text-sm font-medium text-gray-900">{invoice.number}</div>
                    <div className="text-sm text-gray-500">{invoice.description}</div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900">
                    {new Date(invoice.date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-4 text-sm font-medium text-gray-900">
                    ${invoice.amount.toFixed(2)}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                      {getStatusIcon(invoice.status)}
                      <span className="ml-1">{invoice.status}</span>
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center space-x-2">
                      <button className="text-blue-600 hover:text-blue-700">
                        <Eye size={16} />
                      </button>
                      <button className="text-gray-600 hover:text-gray-700">
                        <Download size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderInvoicesTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Invoices</h2>
          <p className="text-gray-600">View and manage your billing history</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
            <Filter size={16} className="text-gray-500" />
            <select className="text-sm border-none focus:ring-0">
              <option>All Status</option>
              <option>Paid</option>
              <option>Pending</option>
              <option>Overdue</option>
            </select>
          </div>
          <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            <Download size={16} />
            <span>Export</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{invoice.number}</div>
                    <div className="text-sm text-gray-500">{invoice.description}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {new Date(invoice.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {new Date(invoice.dueDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    ${invoice.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                      {getStatusIcon(invoice.status)}
                      <span className="ml-1">{invoice.status}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button 
                        className="text-blue-600 hover:text-blue-700"
                        onClick={() => setShowInvoiceDetails(showInvoiceDetails === invoice.id ? null : invoice.id)}
                      >
                        <Eye size={16} />
                      </button>
                      <button className="text-gray-600 hover:text-gray-700">
                        <Download size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderPaymentMethodsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Payment Methods</h2>
          <p className="text-gray-600">Manage your payment methods and billing information</p>
        </div>
        <button 
          onClick={() => setShowAddPaymentMethod(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          <span>Add Payment Method</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {paymentMethods.map((method) => (
          <div key={method.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-500 p-2 rounded-lg">
                  <CreditCard size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{method.brand} •••• {method.last4}</h3>
                  <p className="text-sm text-gray-600">Expires {method.expiryDate}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {method.isDefault && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Default
                  </span>
                )}
                <button className="text-gray-400 hover:text-gray-600">
                  <Edit size={16} />
                </button>
                <button className="text-gray-400 hover:text-red-600">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                method.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {method.status}
              </span>
              {!method.isDefault && (
                <button className="text-blue-600 hover:text-blue-700 text-sm">
                  Set as Default
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Billing Information */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Billing Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
            <input
              type="text"
              value="Acme Corporation"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value="billing@acme.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
            <input
              type="text"
              value="123 Business St"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
            <input
              type="text"
              value="New York, NY 10001"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="mt-6">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Update Billing Information
          </button>
        </div>
      </div>
    </div>
  );

  const renderUsageTab = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Usage Analytics</h2>
        <p className="text-gray-600">Monitor your usage and plan utilization</p>
      </div>

      {/* Usage Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Offers Created</p>
              <p className="text-2xl font-bold text-gray-900">1,247</p>
              <p className="text-xs text-green-600">+12% this month</p>
            </div>
            <div className="bg-blue-500 p-3 rounded-lg">
              <Star size={20} className="text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">API Calls</p>
              <p className="text-2xl font-bold text-gray-900">45.2K</p>
              <p className="text-xs text-green-600">+8% this month</p>
            </div>
            <div className="bg-green-500 p-3 rounded-lg">
              <Zap size={20} className="text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Storage Used</p>
              <p className="text-2xl font-bold text-gray-900">2.4GB</p>
              <p className="text-xs text-gray-600">of 10GB limit</p>
            </div>
            <div className="bg-purple-500 p-3 rounded-lg">
              <Users size={20} className="text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Team Members</p>
              <p className="text-2xl font-bold text-gray-900">8</p>
              <p className="text-xs text-gray-600">of 10 allowed</p>
            </div>
            <div className="bg-orange-500 p-3 rounded-lg">
              <Users size={20} className="text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Plan Comparison */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Plan Comparison</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div key={plan.name} className={`border rounded-lg p-6 ${plan.current ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
              <div className="text-center mb-4">
                <h4 className="text-lg font-semibold text-gray-900">{plan.name}</h4>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-gray-900">${plan.price}</span>
                  <span className="text-gray-600">/{plan.interval}</span>
                </div>
                {plan.current && (
                  <span className="inline-block mt-2 px-3 py-1 bg-blue-500 text-white text-sm rounded-full">
                    Current Plan
                  </span>
                )}
              </div>
              <ul className="space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center space-x-2">
                    <CheckCircle size={16} className="text-green-500" />
                    <span className="text-sm text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                {plan.current ? (
                  <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                    Current Plan
                  </button>
                ) : (
                  <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Upgrade to {plan.name}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverviewTab();
      case 'invoices':
        return renderInvoicesTab();
      case 'payment-methods':
        return renderPaymentMethodsTab();
      case 'usage':
        return renderUsageTab();
      default:
        return renderOverviewTab();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Billing & Subscription</h1>
          <p className="text-gray-600 mt-1">Manage your subscription, payment methods, and billing history</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon size={16} />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default BillingPage;
