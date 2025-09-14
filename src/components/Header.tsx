import React, { useState } from 'react';
import { ShoppingCart, Search, Menu, X, User, Package } from 'lucide-react';
import { useCart } from '../contexts/CartContext';

interface HeaderProps {
  onNavigate: (page: string) => void;
  currentPage: string;
}

export default function Header({ onNavigate, currentPage }: HeaderProps) {
  const { itemCount } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const navigation = [
    { name: 'Home', page: 'home' },
    { name: 'Products', page: 'products' },
    { name: 'About', page: 'about' },
    { name: 'Contact', page: 'contact' },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onNavigate(`products?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div 
            className="flex-shrink-0 cursor-pointer"
            onClick={() => onNavigate('home')}
          >
            <h1 className="text-2xl font-bold text-green-700">NatureSnacks</h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navigation.map((item) => (
              <button
                key={item.name}
                onClick={() => onNavigate(item.page)}
                className={`text-sm font-medium transition-colors duration-200 ${
                  currentPage === item.page
                    ? 'text-green-600 border-b-2 border-green-600'
                    : 'text-gray-600 hover:text-green-600'
                } pb-1`}
              >
                {item.name}
              </button>
            ))}
          </nav>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <form onSubmit={handleSearch} className="w-full relative">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm"
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-green-600"
              >
                <Search size={18} />
              </button>
            </form>
          </div>

          {/* Right Side Icons */}
          <div className="flex items-center space-x-4">
            {/* Track Order */}
            <button
              onClick={() => onNavigate('track-order')}
              className="hidden sm:flex items-center space-x-1 text-gray-600 hover:text-green-600 transition-colors duration-200"
            >
              <Package size={20} />
              <span className="text-sm font-medium">Track Order</span>
            </button>

            {/* Profile */}
            <button
              onClick={() => onNavigate('profile')}
              className="text-gray-600 hover:text-green-600 transition-colors duration-200"
            >
              <User size={20} />
            </button>

            {/* Cart */}
            <button
              onClick={() => onNavigate('cart')}
              className="relative text-gray-600 hover:text-green-600 transition-colors duration-200"
            >
              <ShoppingCart size={20} />
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-green-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden text-gray-600 hover:text-green-600 transition-colors duration-200"
            >
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-100">
            <div className="py-4 space-y-4">
              {/* Mobile Search */}
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm"
                />
                <button
                  type="submit"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                >
                  <Search size={18} />
                </button>
              </form>

              {/* Mobile Navigation */}
              <div className="flex flex-col space-y-2">
                {navigation.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => {
                      onNavigate(item.page);
                      setIsMenuOpen(false);
                    }}
                    className={`text-left py-2 px-2 rounded-lg transition-colors duration-200 ${
                      currentPage === item.page
                        ? 'text-green-600 bg-green-50'
                        : 'text-gray-600 hover:text-green-600 hover:bg-gray-50'
                    }`}
                  >
                    {item.name}
                  </button>
                ))}
                <button
                  onClick={() => {
                    onNavigate('track-order');
                    setIsMenuOpen(false);
                  }}
                  className="text-left py-2 px-2 rounded-lg text-gray-600 hover:text-green-600 hover:bg-gray-50 transition-colors duration-200 flex items-center space-x-2"
                >
                  <Package size={18} />
                  <span>Track Order</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}