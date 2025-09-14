import React, { useState } from 'react';
import { CartProvider } from './contexts/CartContext';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './components/HomePage';
import ProductsPage from './components/ProductsPage';
import ProductDetails from './components/ProductDetails';
import CartPage from './components/CartPage';
import CheckoutPage from './components/CheckoutPage';
import { Product } from './contexts/CartContext';

type Page = 'home' | 'products' | 'cart' | 'checkout' | 'product-details' | 'profile' | 'track-order' | 'order-success' | 'about' | 'contact' | 'privacy' | 'terms' | 'refund';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [urlParams, setUrlParams] = useState('');

  const handleNavigate = (page: string) => {
    // Parse page and parameters
    const [pageName, params] = page.split('?');
    setUrlParams(params || '');
    
    if (params) {
      const urlParams = new URLSearchParams(params);
      setSearchQuery(urlParams.get('search') || '');
      setCategoryFilter(urlParams.get('category') || '');
    } else {
      setSearchQuery('');
      setCategoryFilter('');
    }
    
    setCurrentPage(pageName as Page);
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setCurrentPage('product-details');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onNavigate={handleNavigate} onProductClick={handleProductClick} />;
      case 'products':
        return <ProductsPage onProductClick={handleProductClick} searchQuery={searchQuery} categoryFilter={categoryFilter} />;
      case 'product-details':
        return selectedProduct ? <ProductDetails product={selectedProduct} onNavigate={handleNavigate} /> : <HomePage onNavigate={handleNavigate} onProductClick={handleProductClick} />;
      case 'cart':
        return <CartPage onNavigate={handleNavigate} />;
      case 'checkout':
        return <CheckoutPage onNavigate={handleNavigate} />;
      case 'order-success':
        return <OrderSuccessPage onNavigate={handleNavigate} orderId={new URLSearchParams(urlParams).get('orderId') || ''} />;
      case 'profile':
        return <ProfilePage onNavigate={handleNavigate} />;
      case 'track-order':
        return <TrackOrderPage onNavigate={handleNavigate} />;
      case 'about':
        return <AboutPage onNavigate={handleNavigate} />;
      case 'contact':
        return <ContactPage onNavigate={handleNavigate} />;
      default:
        return <HomePage onNavigate={handleNavigate} onProductClick={handleProductClick} />;
    }
  };

  return (
    <CartProvider>
      <div className="min-h-screen bg-white">
        <Header onNavigate={handleNavigate} currentPage={currentPage} />
        <main>
          {renderPage()}
        </main>
        <Footer onNavigate={handleNavigate} />
      </div>
    </CartProvider>
  );
}

// Placeholder components for remaining pages
function OrderSuccessPage({ onNavigate, orderId }: { onNavigate: (page: string) => void; orderId: string }) {
  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Order Placed Successfully!</h2>
          <p className="text-gray-600 mb-6">
            Thank you for your order. Your healthy snacks will be delivered soon.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600">Order ID</p>
            <p className="text-lg font-semibold text-gray-900">{orderId}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => onNavigate('track-order')}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
            >
              Track Your Order
            </button>
            <button
              onClick={() => onNavigate('products')}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfilePage({ onNavigate }: { onNavigate: (page: string) => void }) {
  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Account</h1>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <p className="text-gray-600 text-center">
            Profile and order history features will be implemented based on your authentication system.
          </p>
          <div className="mt-6 text-center">
            <button
              onClick={() => onNavigate('track-order')}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
            >
              Track Your Orders
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TrackOrderPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [orderId, setOrderId] = useState('');
  const [orderFound, setOrderFound] = useState(false);

  const handleTrackOrder = () => {
    if (orderId.trim()) {
      setOrderFound(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">Track Your Order</h1>
        
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter Order ID
            </label>
            <div className="flex space-x-4">
              <input
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                placeholder="e.g., NS1234567890ABCDE"
              />
              <button
                onClick={handleTrackOrder}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
              >
                Track
              </button>
            </div>
          </div>

          {orderFound && (
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Status</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="font-medium text-gray-900">Order Placed</p>
                    <p className="text-sm text-gray-600">Your order has been received</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="font-medium text-gray-900">Processing</p>
                    <p className="text-sm text-gray-600">We're preparing your order</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                  <div>
                    <p className="font-medium text-gray-900">Shipped</p>
                    <p className="text-sm text-gray-600">Your order is on the way</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                  <div>
                    <p className="font-medium text-gray-400">Delivered</p>
                    <p className="text-sm text-gray-400">Expected delivery: Tomorrow</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AboutPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">About NatureSnacks</h1>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <p className="text-gray-700 leading-relaxed mb-6">
            At NatureSnacks, we believe in the power of natural, wholesome nutrition. Founded with a passion for healthy living, 
            we source the finest nuts, dried fruits, and healthy snacks directly from trusted farmers and suppliers.
          </p>
          <p className="text-gray-700 leading-relaxed mb-6">
            Our commitment to quality means every product undergoes rigorous testing to ensure freshness, taste, and nutritional value. 
            We're dedicated to making healthy snacking accessible, delicious, and convenient for everyone.
          </p>
          <p className="text-gray-700 leading-relaxed">
            Join thousands of satisfied customers who trust NatureSnacks for their daily nutrition needs. 
            Because when it comes to your health, you deserve nothing but the best nature has to offer.
          </p>
        </div>
      </div>
    </div>
  );
}

function ContactPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Contact Us</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Get in Touch</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900">Phone</h3>
                <p className="text-gray-600">+91 98765 43210</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Email</h3>
                <p className="text-gray-600">support@naturesnacks.com</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Address</h3>
                <p className="text-gray-600">123 Organic Street<br />Green Valley, Mumbai 400001</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Send us a Message</h2>
            <form className="space-y-4">
              <input
                type="text"
                placeholder="Your Name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              />
              <input
                type="email"
                placeholder="Your Email"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              />
              <textarea
                rows={4}
                placeholder="Your Message"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none"
              />
              <button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg font-semibold transition-colors duration-200"
              >
                Send Message
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;