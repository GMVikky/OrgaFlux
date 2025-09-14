import { useState, useEffect } from 'react';
import { ArrowLeft, Shield, CreditCard, MapPin } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import emailjs from '@emailjs/browser';

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
  razorpay_order_id?: string;
  razorpay_signature?: string;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  handler: (response: RazorpayResponse) => Promise<void>;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  notes: {
    address: string;
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
  city: string;
  state: string;
  pincode: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  paymentStatus: string;
  razorpayPaymentId?: string;
  orderDate: string;
  orderTime: string;
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => {
      open: () => void;
    };
  }
}

// Environment-based testing flag (can be set via environment variable)
const FORCE_SHEETS_FAIL = process.env.NODE_ENV === 'development' && 
  import.meta.env.VITE_FORCE_SHEETS_FAIL === 'true';

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
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  const shipping = total >= 499 ? 0 : 49;
  const tax = Math.round(total * 0.18);
  const finalTotal = total + shipping + tax;

  // Initialize EmailJS
  useEffect(() => {
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
    if (publicKey) {
      emailjs.init(publicKey);
      console.log('📧 EmailJS initialized successfully');
      
      // Log configuration for debugging
      console.log('🔧 EmailJS Config:', {
        publicKey: publicKey.substring(0, 5) + '***',
        serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID ? 'Set' : 'Missing',
        templateId: import.meta.env.VITE_EMAILJS_TEMPLATE_ID ? 'Set' : 'Missing'
      });
    } else {
      console.warn('⚠️ EmailJS public key not found in environment variables');
    }
  }, []);

  // Load Razorpay script
  useEffect(() => {
    const loadRazorpay = () => {
      return new Promise<boolean>((resolve) => {
        if (window.Razorpay) {
          setRazorpayLoaded(true);
          resolve(true);
          return;
        }

        const existingScript = document.getElementById('razorpay-script');
        if (existingScript) {
          existingScript.onload = () => {
            setRazorpayLoaded(true);
            resolve(true);
          };
          return;
        }

        const script = document.createElement('script');
        script.id = 'razorpay-script';
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        
        script.onload = () => {
          setRazorpayLoaded(true);
          resolve(true);
        };
        
        script.onerror = () => {
          console.error('Failed to load Razorpay script');
          resolve(false);
        };

        document.body.appendChild(script);
      });
    };

    loadRazorpay();
  }, []);

  const handleInputChange = (field: keyof CustomerDetails, value: string | boolean) => {
    setCustomerDetails(prev => ({ ...prev, [field]: value }));
  };

  const generateOrderId = () => {
    return 'ORD' + Date.now() + Math.random().toString(36).substr(2, 4).toUpperCase();
  };

  // 🎯 PRIMARY METHOD: EmailJS Integration
  const sendOrderViaEmailJS = async (orderData: OrderData): Promise<boolean> => {
    try {
      const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
      const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
      
      if (!serviceId || !templateId) {
        throw new Error('EmailJS configuration missing');
      }

      // Format items for email
      const itemsList = orderData.items.map(item => 
        `• ${item.name} (Qty: ${item.quantity}) - ₹${item.price * item.quantity}`
      ).join('\n');

      // Email template parameters
      const templateParams = {
        to_name: 'OrgaFlux Team',
        from_name: orderData.customerName,
        order_id: orderData.orderId,
        customer_name: orderData.customerName,
        customer_email: orderData.email,
        customer_phone: orderData.phone,
        customer_address: `${orderData.address}, ${orderData.city}, ${orderData.state} - ${orderData.pincode}`,
        items_list: itemsList,
        subtotal: `₹${orderData.subtotal}`,
        shipping: orderData.shipping === 0 ? 'FREE' : `₹${orderData.shipping}`,
        tax: `₹${orderData.tax}`,
        total: `₹${orderData.total}`,
        payment_status: orderData.paymentStatus,
        payment_id: orderData.razorpayPaymentId || 'N/A',
        order_date: orderData.orderDate,
        order_time: orderData.orderTime,
        reply_to: orderData.email,
        // Additional useful fields
        item_count: orderData.items.reduce((sum, item) => sum + item.quantity, 0),
        order_summary: `${orderData.items.length} items worth ₹${orderData.total}`
      };

      // Send email
      const result = await emailjs.send(serviceId, templateId, templateParams);
      
      if (result.status === 200) {
        console.log('✅ EmailJS: Order email sent successfully');
        return true;
      } else {
        throw new Error(`EmailJS returned status: ${result.status}`);
      }

    } catch (error) {
      console.error('❌ EmailJS failed:', error);
      return false;
    }
  };

  // 🛡️ FALLBACK METHOD: Google Sheets Form POST (No CORS)
  const sendOrderViaGoogleSheets = async (orderData: OrderData): Promise<boolean> => {
    try {
      // 🧪 Testing mode - force Sheets to fail
      if (FORCE_SHEETS_FAIL) {
        console.log('🧪 TEST MODE: Forcing Google Sheets to fail');
        throw new Error('Google Sheets test failure mode enabled');
      }

      const webhookUrl = import.meta.env.VITE_SHEET_WEBHOOK_URL;
      
      if (!webhookUrl) {
        throw new Error('Google Sheets webhook URL not configured');
      }

      // Create hidden iframe for form submission
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.name = 'hidden_iframe_' + Date.now();
      document.body.appendChild(iframe);

      // Create form element
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = webhookUrl;
      form.target = iframe.name;
      form.style.display = 'none';

      // Prepare form data
      const formFields = {
        orderId: orderData.orderId,
        customerName: orderData.customerName,
        email: orderData.email,
        phone: orderData.phone,
        address: orderData.address,
        city: orderData.city,
        state: orderData.state,
        pincode: orderData.pincode,
        items: JSON.stringify(orderData.items),
        subtotal: orderData.subtotal.toString(),
        shipping: orderData.shipping.toString(),
        tax: orderData.tax.toString(),
        total: orderData.total.toString(),
        paymentStatus: orderData.paymentStatus,
        razorpayPaymentId: orderData.razorpayPaymentId || '',
        orderDate: orderData.orderDate,
        orderTime: orderData.orderTime,
        timestamp: new Date().toISOString()
      };

      // Create hidden inputs
      Object.entries(formFields).forEach(([key, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = value;
        form.appendChild(input);
      });

      // Add form to document and submit
      document.body.appendChild(form);
      form.submit();

      // Clean up after submission
      setTimeout(() => {
        if (document.body.contains(form)) document.body.removeChild(form);
        if (document.body.contains(iframe)) document.body.removeChild(iframe);
      }, 3000);

      console.log('✅ Google Sheets: Order submitted via form POST');
      return true;

    } catch (error) {
      console.error('❌ Google Sheets fallback failed:', error);
      return false;
    }
  };

  // 💾 LOCAL STORAGE BACKUP (Always works)
  const saveOrderLocally = (orderData: OrderData) => {
    try {
      const orderWithMetadata = {
        ...orderData,
        savedAt: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      };
      
      localStorage.setItem(
        `order_${orderData.orderId}`,
        JSON.stringify(orderWithMetadata)
      );
      
      // Also maintain a list of all orders
      const existingOrders = JSON.parse(localStorage.getItem('all_orders') || '[]');
      existingOrders.push({
        orderId: orderData.orderId,
        customerName: orderData.customerName,
        total: orderData.total,
        date: orderData.orderDate,
        time: orderData.orderTime
      });
      localStorage.setItem('all_orders', JSON.stringify(existingOrders));
      
      console.log('✅ Order saved locally');
      return true;
    } catch (error) {
      console.error('❌ Local storage failed:', error);
      return false;
    }
  };

  // 🚀 MAIN ORDER SUBMISSION HANDLER
  const handleOrderSubmission = async (orderData: OrderData) => {
    console.log('🔄 Processing order:', orderData.orderId);
    
    const results = {
      emailjs: false,
      googleSheets: false,
      localStorage: false
    };

    // Always save locally first (instant backup)
    results.localStorage = saveOrderLocally(orderData);

    // Try EmailJS first (primary method)
    results.emailjs = await sendOrderViaEmailJS(orderData);

    // If EmailJS fails, try Google Sheets
    if (!results.emailjs) {
      console.log('📋 EmailJS failed, trying Google Sheets fallback...');
      results.googleSheets = await sendOrderViaGoogleSheets(orderData);
    }

    // Log results
    console.log('📊 Submission Results:', results);

    // Determine success message
    if (results.emailjs) {
      return {
        success: true,
        message: 'Order placed successfully! Confirmation email sent.',
        method: 'EmailJS'
      };
    } else if (results.googleSheets) {
      return {
        success: true,
        message: 'Order placed successfully! Order details saved.',
        method: 'Google Sheets'
      };
    } else if (results.localStorage) {
      return {
        success: true,
        message: 'Order placed and saved! We will contact you soon.',
        method: 'Local Storage'
      };
    } else {
      return {
        success: false,
        message: 'Order submission failed. Please try again or contact support.',
        method: 'None'
      };
    }
  };

  const handleQRPayment = () => {
    setIsProcessing(true);
    setShowQRCode(true);
  };

  const confirmQRPayment = async () => {
    const orderId = generateOrderId();
    const now = new Date();
    
    const orderData: OrderData = {
      orderId: orderId,
      customerName: customerDetails.name,
      email: customerDetails.email,
      phone: customerDetails.phone,
      address: customerDetails.address,
      city: customerDetails.city,
      state: customerDetails.state,
      pincode: customerDetails.pincode,
      items: items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price
      })),
      subtotal: total,
      shipping: shipping,
      tax: tax,
      total: finalTotal,
      paymentStatus: 'Completed (QR Payment)',
      orderDate: now.toLocaleDateString('en-IN'),
      orderTime: now.toLocaleTimeString('en-IN')
    };

    // Submit order with fallback system
    const submissionResult = await handleOrderSubmission(orderData);
    
    // Show user-friendly message
    if (submissionResult.success) {
      // Clear cart and navigate to success page
      clearCart();
      setShowQRCode(false);
      setIsProcessing(false);
      onNavigate(`order-success?orderId=${orderId}`);
    } else {
      alert(submissionResult.message);
      setIsProcessing(false);
    }
  };

  const handlePayment = async () => {
    // Validation checks
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

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerDetails.email)) {
      alert('Please enter a valid email address');
      return;
    }

    // Phone validation (Indian format)
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(customerDetails.phone.replace(/\D/g, '').slice(-10))) {
      alert('Please enter a valid 10-digit phone number');
      return;
    }

    // Pincode validation
    const pincodeRegex = /^\d{6}$/;
    if (!pincodeRegex.test(customerDetails.pincode)) {
      alert('Please enter a valid 6-digit PIN code');
      return;
    }

    // Handle QR payment
    if (paymentMethod === 'qr') {
      handleQRPayment();
      return;
    }

    // Check Razorpay
    if (!razorpayLoaded || !window.Razorpay) {
      alert('Payment system is loading. Please wait a moment and try again.');
      return;
    }

    setIsProcessing(true);
    const orderId = generateOrderId();

    // Razorpay configuration
    const options: RazorpayOptions = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_RHL0EY3cPQO5qF',
      amount: finalTotal * 100, // Amount in paise
      currency: 'INR',
      name: 'Orgaflux',
      description: 'Premium Healthy Snacks Purchase',
      handler: async function (response: RazorpayResponse) {
        console.log('💳 Payment successful:', response);
        
        const now = new Date();
        
        const orderData: OrderData = {
          orderId: orderId,
          customerName: customerDetails.name,
          email: customerDetails.email,
          phone: customerDetails.phone,
          address: customerDetails.address,
          city: customerDetails.city,
          state: customerDetails.state,
          pincode: customerDetails.pincode,
          items: items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price
          })),
          subtotal: total,
          shipping: shipping,
          tax: tax,
          total: finalTotal,
          paymentStatus: 'Completed',
          razorpayPaymentId: response.razorpay_payment_id,
          orderDate: now.toLocaleDateString('en-IN'),
          orderTime: now.toLocaleTimeString('en-IN')
        };

        // Submit order with fallback system
        await handleOrderSubmission(orderData);
        
        // Always proceed to success page after successful payment
        clearCart();
        setIsProcessing(false);
        onNavigate(`order-success?orderId=${orderId}&paymentId=${response.razorpay_payment_id}`);
      },
      prefill: {
        name: customerDetails.name,
        email: customerDetails.email,
        contact: customerDetails.phone
      },
      notes: {
        address: `${customerDetails.address}, ${customerDetails.city}, ${customerDetails.state} ${customerDetails.pincode}`
      },
      theme: {
        color: '#16A34A'
      },
      modal: {
        ondismiss: function() {
          console.log('Payment modal closed');
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

  // Empty cart check
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
                    required
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
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={customerDetails.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    placeholder="Enter your 10-digit phone number"
                    maxLength={10}
                    required
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
                    required
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
                      required
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
                      required
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
                      placeholder="6-digit PIN Code"
                      maxLength={6}
                      required
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
                  required
                />
                <label htmlFor="terms" className="text-sm text-gray-700">
                  I agree to the <button type="button" className="text-green-600 hover:text-green-700 underline">Terms and Conditions</button> and <button type="button" className="text-green-600 hover:text-green-700 underline">Privacy Policy</button>
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
                disabled={isProcessing || !razorpayLoaded}
                className={`w-full mt-6 py-4 px-6 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center space-x-2 ${
                  isProcessing || !razorpayLoaded
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 transform hover:scale-105'
                } text-white`}
              >
                <Shield size={20} />
                <span>
                  {!razorpayLoaded 
                    ? 'Loading Payment...'
                    : isProcessing 
                      ? 'Processing...' 
                      : paymentMethod === 'qr' 
                        ? 'Show QR Code' 
                        : 'Pay Securely'
                  }
                </span>
              </button>

              <div className="mt-4 flex items-center justify-center space-x-2 text-xs text-gray-500">
                <CreditCard size={16} />
                <span>Secured by Razorpay</span>
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
    </div>
  );
}