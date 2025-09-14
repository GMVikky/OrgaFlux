import React, { useState } from 'react';
import { ArrowLeft, Star, Plus, Minus, ShoppingCart, Heart, Share2, Truck, Shield, RotateCcw } from 'lucide-react';
import { Product } from '../contexts/CartContext';
import { useCart } from '../contexts/CartContext';

interface ProductDetailsProps {
  product: Product;
  onNavigate: (page: string) => void;
}

export default function ProductDetails({ product, onNavigate }: ProductDetailsProps) {
  const { addItem, items, updateQuantity } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');

  const cartItem = items.find(item => item.id === product.id);
  const currentQuantityInCart = cartItem?.quantity || 0;

  const handleQuantityChange = (change: number) => {
    setQuantity(Math.max(1, quantity + change));
  };

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addItem(product);
    }
    setQuantity(1);
  };

  const handleUpdateCartQuantity = (newQuantity: number) => {
    if (cartItem) {
      updateQuantity(product.id, newQuantity);
    }
  };

  const discountPercentage = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const tabs = [
    { id: 'description', label: 'Description' },
    { id: 'nutrition', label: 'Nutrition Info' },
    { id: 'reviews', label: `Reviews (${product.reviews})` },
  ];

  const features = [
    { icon: Truck, text: 'Free delivery on orders above ₹499', color: 'text-green-600' },
    { icon: Shield, text: '100% quality guarantee', color: 'text-blue-600' },
    { icon: RotateCcw, text: 'Easy 7-day returns', color: 'text-purple-600' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-8">
          <button
            onClick={() => onNavigate('products')}
            className="flex items-center space-x-2 hover:text-green-600 transition-colors duration-200"
          >
            <ArrowLeft size={16} />
            <span>Back to Products</span>
          </button>
          <span>/</span>
          <span>{product.category}</span>
          <span>/</span>
          <span className="text-gray-900">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square rounded-2xl overflow-hidden bg-white shadow-lg">
              <img 
                src={product.image} 
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Additional product info cards */}
            <div className="grid grid-cols-3 gap-4">
              {features.map((feature, index) => (
                <div key={index} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                  <feature.icon size={24} className={`${feature.color} mb-2`} />
                  <p className="text-xs text-gray-600">{feature.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="inline-block bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                  {product.category}
                </span>
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-gray-400 hover:text-red-500 transition-colors duration-200">
                    <Heart size={20} />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-blue-500 transition-colors duration-200">
                    <Share2 size={20} />
                  </button>
                </div>
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>
              
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={18}
                      className={`${
                        i < Math.floor(product.rating)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-gray-600">({product.reviews} reviews)</span>
                <span className="text-green-600 font-medium">{product.rating}/5</span>
              </div>

              <div className="flex items-center space-x-3 mb-6">
                <span className="text-3xl font-bold text-gray-900">₹{product.price}</span>
                {product.originalPrice && (
                  <>
                    <span className="text-lg text-gray-500 line-through">₹{product.originalPrice}</span>
                    <span className="bg-red-100 text-red-800 text-sm font-medium px-2 py-1 rounded-full">
                      {discountPercentage}% OFF
                    </span>
                  </>
                )}
              </div>

              <div className="mb-6">
                <span className="text-sm text-gray-600">Weight: </span>
                <span className="font-medium text-gray-900">{product.weight}</span>
              </div>

              {!product.inStock ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <p className="text-red-800 font-medium">Currently out of stock</p>
                  <p className="text-red-600 text-sm">We'll notify you when this item is back in stock.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Quantity Selector */}
                  <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium text-gray-900">Quantity:</span>
                    <div className="flex items-center border border-gray-300 rounded-lg">
                      <button
                        onClick={() => handleQuantityChange(-1)}
                        className="p-2 hover:bg-gray-100 transition-colors duration-200"
                        disabled={quantity <= 1}
                      >
                        <Minus size={16} />
                      </button>
                      <span className="px-4 py-2 font-medium">{quantity}</span>
                      <button
                        onClick={() => handleQuantityChange(1)}
                        className="p-2 hover:bg-gray-100 transition-colors duration-200"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Add to Cart Button */}
                  <button
                    onClick={handleAddToCart}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-4 px-6 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center space-x-2 transform hover:scale-105"
                  >
                    <ShoppingCart size={20} />
                    <span>Add to Cart</span>
                  </button>

                  {/* Current Cart Status */}
                  {currentQuantityInCart > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-green-800 font-medium">
                          {currentQuantityInCart} item{currentQuantityInCart > 1 ? 's' : ''} in cart
                        </span>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleUpdateCartQuantity(currentQuantityInCart - 1)}
                            className="p-1 text-green-600 hover:bg-green-100 rounded"
                            disabled={currentQuantityInCart <= 1}
                          >
                            <Minus size={14} />
                          </button>
                          <span className="px-2 text-green-800 font-medium">{currentQuantityInCart}</span>
                          <button
                            onClick={() => handleUpdateCartQuantity(currentQuantityInCart + 1)}
                            className="p-1 text-green-600 hover:bg-green-100 rounded"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Product Details Tabs */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex space-x-1 mb-6 bg-gray-100 rounded-lg p-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-white text-green-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="min-h-[200px]">
                {activeTab === 'description' && (
                  <div>
                    <p className="text-gray-700 leading-relaxed">{product.description}</p>
                  </div>
                )}

                {activeTab === 'nutrition' && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Nutritional Information</h4>
                    <p className="text-gray-700">{product.nutritionalInfo}</p>
                    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        <strong>Note:</strong> Nutritional values are approximate and may vary based on natural variations in ingredients.
                      </p>
                    </div>
                  </div>
                )}

                {activeTab === 'reviews' && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-4">Customer Reviews</h4>
                    <div className="space-y-4">
                      {/* Sample reviews */}
                      <div className="border-b border-gray-200 pb-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} size={14} className="text-yellow-400 fill-current" />
                            ))}
                          </div>
                          <span className="font-medium text-gray-900">Excellent Quality!</span>
                        </div>
                        <p className="text-gray-700 text-sm mb-2">
                          "Amazing taste and freshness. Perfect for my morning snacks. Will definitely order again!"
                        </p>
                        <span className="text-xs text-gray-500">- Verified Purchase</span>
                      </div>
                      
                      <div className="border-b border-gray-200 pb-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="flex items-center">
                            {[...Array(4)].map((_, i) => (
                              <Star key={i} size={14} className="text-yellow-400 fill-current" />
                            ))}
                            <Star size={14} className="text-gray-300" />
                          </div>
                          <span className="font-medium text-gray-900">Good Value</span>
                        </div>
                        <p className="text-gray-700 text-sm mb-2">
                          "Good quality product. Packaging could be better but the taste is great."
                        </p>
                        <span className="text-xs text-gray-500">- Verified Purchase</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}