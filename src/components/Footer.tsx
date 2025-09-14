import React from 'react';
import { Mail, Phone, MapPin, Facebook, Instagram, Twitter } from 'lucide-react';

interface FooterProps {
  onNavigate: (page: string) => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-2xl font-bold text-green-400 mb-4">NatureSnacks</h3>
            <p className="text-gray-300 mb-6 max-w-md">
              Premium quality healthy snacks, nuts, and dried fruits sourced directly from farmers. 
              Committed to providing nutritious and delicious products for your healthy lifestyle.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-green-400 transition-colors duration-200">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-green-400 transition-colors duration-200">
                <Instagram size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-green-400 transition-colors duration-200">
                <Twitter size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <div className="space-y-3">
              <button 
                onClick={() => onNavigate('home')}
                className="block text-gray-300 hover:text-green-400 transition-colors duration-200 text-sm"
              >
                Home
              </button>
              <button 
                onClick={() => onNavigate('products')}
                className="block text-gray-300 hover:text-green-400 transition-colors duration-200 text-sm"
              >
                All Products
              </button>
              <button 
                onClick={() => onNavigate('about')}
                className="block text-gray-300 hover:text-green-400 transition-colors duration-200 text-sm"
              >
                About Us
              </button>
              <button 
                onClick={() => onNavigate('track-order')}
                className="block text-gray-300 hover:text-green-400 transition-colors duration-200 text-sm"
              >
                Track Order
              </button>
              <button 
                onClick={() => onNavigate('contact')}
                className="block text-gray-300 hover:text-green-400 transition-colors duration-200 text-sm"
              >
                Contact Us
              </button>
            </div>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Customer Service</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Phone size={16} className="text-green-400" />
                <span className="text-gray-300 text-sm">+91 98765 43210</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail size={16} className="text-green-400" />
                <span className="text-gray-300 text-sm">support@naturesnacks.com</span>
              </div>
              <div className="flex items-start space-x-2">
                <MapPin size={16} className="text-green-400 mt-0.5" />
                <span className="text-gray-300 text-sm">
                  123 Organic Street<br />
                  Green Valley, Mumbai 400001
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-400 text-sm">
              © 2024 NatureSnacks. All rights reserved.
            </p>
            <div className="flex space-x-6 text-sm">
              <button 
                onClick={() => onNavigate('privacy')}
                className="text-gray-400 hover:text-green-400 transition-colors duration-200"
              >
                Privacy Policy
              </button>
              <button 
                onClick={() => onNavigate('terms')}
                className="text-gray-400 hover:text-green-400 transition-colors duration-200"
              >
                Terms & Conditions
              </button>
              <button 
                onClick={() => onNavigate('refund')}
                className="text-gray-400 hover:text-green-400 transition-colors duration-200"
              >
                Refund Policy
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}