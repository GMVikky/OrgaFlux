import { useState } from 'react';
import { ArrowLeft, Shield, CreditCard, MapPin } from 'lucide-react';
import { useCart } from '../contexts/CartContext';

interface CheckoutPageProps {
  onNavigate: (page: string) => void;
}

interface CustomerDetails {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  sameAsBilling: boolean;
  billingAddress?: string;
  billingCity?: string;
  billingState?: string;
  billingPincode?: string;
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => Promise<void>;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  notes: {
    orderId: string;
    items: string;
  };
  theme: {
    color: string;
  };
  modal: {
    ondismiss: () => void;
  };
}

interface OrderData {
  orderId: string;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  paymentStatus: string;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  razorpaySignature?: string;
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => {
      open: () => void;
    };
  }
}

export default function CheckoutPage({ onNavigate }: CheckoutPageProps) {
  const { items, total, itemCount, clearCart } = useCart();
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails>({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    sameAsBilling: true,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [paymentMethod] = useState<'razorpay' | 'qr'>('razorpay');
  const [showQRCode, setShowQRCode] = useState(false);

  const shipping = total >= 499 ? 0 : 49;
  const tax = Math.round(total * 0.18);
  const finalTotal = total + shipping + tax;

  const handleInputChange = (field: keyof CustomerDetails, value: string | boolean) => {
    setCustomerDetails(prev => ({ ...prev, [field]: value }));
  };

  const generateOrderId = () => {
    return 'NS' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
  };

  const submitToGoogleForms = async (orderData: OrderData) => {
    const formData = new FormData();
    
    // TODO: Replace these entry IDs with your actual Google Form field IDs
    // To get entry IDs: Inspect your Google Form and look for input names like "entry.123456789"
    formData.append('entry.ORDER_ID_ENTRY', orderData.orderId); // Order ID
    formData.append('entry.CUSTOMER_NAME_ENTRY', orderData.customerName); // Customer Name
    formData.append('entry.EMAIL_ENTRY', orderData.email); // Email
    formData.append('entry.PHONE_ENTRY', orderData.phone); // Phone
    formData.append('entry.ADDRESS_ENTRY', orderData.address); // Address
    formData.append('entry.ITEMS_ENTRY', JSON.stringify(orderData.items)); // Items
    formData.append('entry.TOTAL_ENTRY', orderData.total.toString()); // Total Amount
    formData.append('entry.PAYMENT_STATUS_ENTRY', orderData.paymentStatus); // Payment Status
    formData.append('entry.ORDER_DATE_ENTRY', new Date().toISOString()); // Order Date

    try {
      const formUrl = import.meta.env.VITE_GOOGLE_FORM_URL || 'https://docs.google.com/forms/d/e/YOUR_FORM_ID/formResponse';
      await fetch(formUrl, {
        method: 'POST',
        body: formData,
        mode: 'no-cors'
      });
    } catch (error) {
      console.error('Error submitting to Google Forms:', error);
    }
  };

  const handleQRPayment = () => {
    setIsProcessing(true);
    setShowQRCode(true);
  };

  const confirmQRPayment = async () => {
    const orderId = generateOrderId();
    
    const orderData: OrderData = {
      orderId: orderId,
      customerName: customerDetails.name,
      email: customerDetails.email,
      phone: customerDetails.phone,
      address: `${customerDetails.address}, ${customerDetails.city}, ${customerDetails.state} ${customerDetails.pincode}`,
      items: items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price
      })),
      total: finalTotal,
      paymentStatus: 'Completed'
    };

    // Submit to Google Forms
    await submitToGoogleForms(orderData);

    // Clear cart and navigate to success page
    clearCart();
    setShowQRCode(false);
    onNavigate(`order-success?orderId=${orderId}`);
  };

  const handlePayment = async () => {
    if (!termsAccepted) {
      alert('Please accept the terms and conditions');
      return;
    }

    const requiredFields = ['name', 'email', 'phone', 'address', 'city', 'state', 'pincode'];
    for (const field of requiredFields) {
      if (!customerDetails[field as keyof CustomerDetails]) {
        alert(`Please fill in ${field.charAt(0).toUpperCase() + field.slice(1)}`);
        return;
      }
    }

    if (paymentMethod === 'qr') {
      handleQRPayment();
      return;
    }
    setIsProcessing(true);

    const orderId = generateOrderId();

    const options: RazorpayOptions = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_RHL0EY3cPQO5qF',
      amount: finalTotal * 100, // Amount in paise
      currency: 'INR',
      name: 'NatureSnacks',
      description: 'Premium Healthy Snacks Purchase',
      order_id: orderId,
      handler: async function (response: RazorpayResponse) {
        // Payment successful
        const orderData: OrderData = {
          orderId: orderId,
          customerName: customerDetails.name,
          email: customerDetails.email,
          phone: customerDetails.phone,
          address: `${customerDetails.address}, ${customerDetails.city}, ${customerDetails.state} ${customerDetails.pincode}`,
          items: items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price
          })),
          total: finalTotal,
          paymentStatus: 'Completed',
          razorpayPaymentId: response.razorpay_payment_id,
          razorpayOrderId: response.razorpay_order_id,
          razorpaySignature: response.razorpay_signature
        };

        // Submit to Google Forms
        await submitToGoogleForms(orderData);

        // Clear cart and navigate to success page
        clearCart();
        onNavigate(`order-success?orderId=${orderId}`);
      },
      prefill: {
        name: customerDetails.name,
        email: customerDetails.email,
        contact: customerDetails.phone
      },
      notes: {
        orderId: orderId,
        items: JSON.stringify(items.map(item => `${item.name} x ${item.quantity}`))
      },
      theme: {
        color: '#16A34A'
      },
      modal: {
        ondismiss: function() {
          setIsProcessing(false);
        }
      }
    };

    try {
      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Error initializing Razorpay:', error);
      alert('Payment initialization failed. Please try again.');
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">No items in cart</h2>
            <p className="text-gray-600 mb-8">Please add some items to your cart before checkout.</p>
            <button
              onClick={() => onNavigate('products')}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors duration-200"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <button
            onClick={() => onNavigate('cart')}
            className="flex items-center space-x-2 text-gray-600 hover:text-green-600 transition-colors duration-200"
          >
            <ArrowLeft size={20} />
            <span>Back to Cart</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Details */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center space-x-2 mb-6">
                <MapPin size={20} className="text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">Customer Details</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={customerDetails.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={customerDetails.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={customerDetails.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    placeholder="Enter your phone number"
                  />
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Shipping Address</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address *
                  </label>
                  <textarea
                    value={customerDetails.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none"
                    placeholder="Enter your full address"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      value={customerDetails.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                      placeholder="City"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State *
                    </label>
                    <input
                      type="text"
                      value={customerDetails.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                      placeholder="State"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      PIN Code *
                    </label>
                    <input
                      type="text"
                      value={customerDetails.pincode}
                      onChange={(e) => handleInputChange('pincode', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                      placeholder="PIN Code"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="terms"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-1 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="terms" className="text-sm text-gray-700">
                  I agree to the <button className="text-green-600 hover:text-green-700 underline">Terms and Conditions</button> and <button className="text-green-600 hover:text-green-700 underline">Privacy Policy</button>
                </label>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Order Summary</h3>
              
              {/* Items */}
              <div className="space-y-3 mb-6">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center py-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      ₹{item.price * item.quantity}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 pt-4 space-y-3">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({itemCount} items)</span>
                  <span>₹{total}</span>
                </div>
                
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className={shipping === 0 ? 'text-green-600 font-medium' : ''}>
                    {shipping === 0 ? 'FREE' : `₹${shipping}`}
                  </span>
                </div>
                
                <div className="flex justify-between text-gray-600">
                  <span>Tax (GST 18%)</span>
                  <span>₹{tax}</span>
                </div>
                
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Total</span>
                    <span className="text-2xl font-bold text-green-600">₹{finalTotal}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handlePayment}
                disabled={isProcessing}
                className={`w-full mt-6 py-4 px-6 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center space-x-2 ${
                  isProcessing
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 transform hover:scale-105'
                } text-white`}
              >
                <Shield size={20} />
                <span>
                  {isProcessing 
                    ? 'Processing...' 
                    : paymentMethod === 'qr' 
                      ? 'Show QR Code' 
                      : 'Pay Securely'
                  }
                </span>
              </button>

              <div className="mt-4 flex items-center justify-center space-x-2 text-xs text-gray-500">
                <CreditCard size={16} />
                <span>
                  {paymentMethod === 'razorpay' ? 'Secured by Razorpay' : 'Secure UPI Payment'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQRCode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Scan QR Code to Pay</h3>
              <p className="text-gray-600 mb-6">Use any UPI app to scan and pay ₹{finalTotal}</p>
              
              <div className="bg-white p-4 rounded-xl border-2 border-gray-200 mb-6 inline-block">
                <img 
                  src="/WhatsApp Image 2025-09-14 at 08.06.47_bc694ea5.jpg" 
                  alt="Payment QR Code" 
                  className="w-64 h-64 object-contain"
                />
              </div>
              
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800 font-medium">
                    Amount to Pay: ₹{finalTotal}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Please ensure you pay the exact amount
                  </p>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={confirmQRPayment}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg font-semibold transition-colors duration-200"
                  >
                    Payment Completed
                  </button>
                  <button
                    onClick={() => {
                      setShowQRCode(false);
                      setIsProcessing(false);
                    }}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-semibold transition-colors duration-200"
                  >
                    Cancel
                  </button>
                </div>
                
                <p className="text-xs text-gray-500">
                  Click "Payment Completed" only after successful payment
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Razorpay Script */}
      <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
    </div>
  );
}