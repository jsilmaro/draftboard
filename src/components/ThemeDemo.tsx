import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import ThemeToggle from './ThemeToggle';

const ThemeDemo: React.FC = () => {
  const { theme, isDark } = useTheme();
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="marketplace-header p-6 rounded-lg">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-foreground">Theme Demo</h1>
            <ThemeToggle size="lg" showLabel />
          </div>
          <p className="text-foreground-secondary mt-2">
            Current theme: <span className="font-semibold">{theme}</span> ({isDark ? 'Dark' : 'Light'} mode)
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Product Card 1 */}
          <div className="product-card">
            <div className="product-card-image bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
              <span className="text-white text-2xl font-bold">Product 1</span>
            </div>
            <div className="product-card-content">
              <h3 className="product-card-title">Premium Marketplace Item</h3>
              <p className="product-card-creator">By Creative Designer</p>
              <p className="product-card-price">$299</p>
            </div>
          </div>

          {/* Product Card 2 */}
          <div className="product-card">
            <div className="product-card-image bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
              <span className="text-white text-2xl font-bold">Product 2</span>
            </div>
            <div className="product-card-content">
              <h3 className="product-card-title">Digital Asset Bundle</h3>
              <p className="product-card-creator">By Digital Studio</p>
              <p className="product-card-price">$149</p>
            </div>
          </div>

          {/* Product Card 3 */}
          <div className="product-card">
            <div className="product-card-image bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
              <span className="text-white text-2xl font-bold">Product 3</span>
            </div>
            <div className="product-card-content">
              <h3 className="product-card-title">Creative Template Pack</h3>
              <p className="product-card-creator">By Template Co.</p>
              <p className="product-card-price">$89</p>
            </div>
          </div>
        </div>

        {/* Buttons Section */}
        <div className="marketplace-card p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Button Styles</h2>
          <div className="flex flex-wrap gap-4">
            <button className="marketplace-button">Primary Button</button>
            <button className="marketplace-button-secondary">Secondary Button</button>
            <button className="marketplace-button" style={{ backgroundColor: 'var(--accent-green)' }}>
              Success Button
            </button>
            <button className="marketplace-button" style={{ backgroundColor: 'var(--accent-purple)' }}>
              Purple Button
            </button>
          </div>
        </div>

        {/* Form Section */}
        <div className="marketplace-card p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Form Elements</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground-secondary mb-2">
                Search Products
              </label>
              <input
                type="text"
                placeholder="Search for products, creators..."
                className="marketplace-search w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground-secondary mb-2">
                Email Address
              </label>
              <input
                type="email"
                placeholder="Enter your email"
                className="marketplace-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground-secondary mb-2">
                Category
              </label>
              <select className="marketplace-input">
                <option>Select a category</option>
                <option>Design</option>
                <option>Development</option>
                <option>Marketing</option>
                <option>Photography</option>
              </select>
            </div>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="marketplace-nav p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-foreground mb-4">Navigation</h2>
          <div className="flex flex-wrap gap-2">
            <a href="#" className="marketplace-nav-item active">Home</a>
            <a href="#" className="marketplace-nav-item">Marketplace</a>
            <a href="#" className="marketplace-nav-item">Community</a>
            <a href="#" className="marketplace-nav-item">Events</a>
            <a href="#" className="marketplace-nav-item">Success Stories</a>
          </div>
        </div>

        {/* Dashboard Components */}
        <div className="marketplace-card p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Dashboard Components</h2>
          <div className="space-y-4">
            <div className="dashboard-card p-4">
              <h3 className="font-semibold text-foreground mb-2">Dashboard Card</h3>
              <p className="text-foreground-secondary text-sm">This is a dashboard card with theme-aware styling.</p>
            </div>
            
            <div className="table-container">
              <div className="table-header">
                <h3 className="table-title">Sample Table</h3>
              </div>
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>John Doe</td>
                    <td><span className="status-pending px-2 py-1 rounded-full text-xs">Pending</span></td>
                    <td>2024-01-15</td>
                  </tr>
                  <tr>
                    <td>Jane Smith</td>
                    <td><span className="status-approved px-2 py-1 rounded-full text-xs">Approved</span></td>
                    <td>2024-01-14</td>
                  </tr>
                  <tr>
                    <td>Bob Johnson</td>
                    <td><span className="status-rejected px-2 py-1 rounded-full text-xs">Rejected</span></td>
                    <td>2024-01-13</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Form Components */}
        <div className="marketplace-card p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Form Components</h2>
          <div className="space-y-4">
            <div>
              <label className="form-label">Full Name</label>
              <input type="text" placeholder="Enter your full name" className="form-input" />
            </div>
            <div>
              <label className="form-label">Email Address</label>
              <input type="email" placeholder="Enter your email" className="form-input" />
            </div>
            <div>
              <label className="form-label">Category</label>
              <select className="form-select">
                <option>Select a category</option>
                <option>Design</option>
                <option>Development</option>
                <option>Marketing</option>
              </select>
            </div>
            <div>
              <label className="form-label">Message</label>
              <textarea placeholder="Enter your message" className="form-textarea"></textarea>
            </div>
          </div>
        </div>

        {/* Modal Test */}
        <div className="marketplace-card p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Modal Test</h2>
          <button 
            onClick={() => setShowModal(true)}
            className="marketplace-button"
          >
            Open Modal
          </button>
        </div>

        {/* Color Palette */}
        <div className="marketplace-card p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Color Palette</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="w-16 h-16 rounded-lg mx-auto mb-2" style={{ backgroundColor: 'var(--accent-blue)' }}></div>
              <p className="text-sm text-foreground-secondary">Primary Blue</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-lg mx-auto mb-2" style={{ backgroundColor: 'var(--accent-green)' }}></div>
              <p className="text-sm text-foreground-secondary">Success Green</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-lg mx-auto mb-2" style={{ backgroundColor: 'var(--accent-purple)' }}></div>
              <p className="text-sm text-foreground-secondary">Purple</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-lg mx-auto mb-2 bg-background-secondary border border-card-border"></div>
              <p className="text-sm text-foreground-secondary">Background</p>
            </div>
          </div>
        </div>

        {/* Test Modal */}
        {showModal && (
          <div className="modal-overlay fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="modal-content max-w-md w-full">
              <div className="modal-header flex justify-between items-center">
                <h3 className="modal-title">Test Modal</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 rounded-lg transition-colors text-foreground-muted hover:text-foreground hover:bg-background-secondary"
                >
                  ✕
                </button>
              </div>
              <div className="modal-body">
                <p className="text-foreground-secondary mb-4">
                  This is a test modal to verify that modal components work correctly with the theme system.
                </p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowModal(false)}
                    className="marketplace-button flex-1"
                  >
                    Close
                  </button>
                  <button 
                    onClick={() => setShowModal(false)}
                    className="marketplace-button-secondary flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ThemeDemo;
