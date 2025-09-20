import React, { useState } from 'react';
import { Order } from '../types';

interface OrderCardProps {
  order: Order;
  index: number;
  onUpdateOrder: (index: number, newRoute: string, newProduct: string, newTrays: number) => void;
  onDeleteOrder: (index: number) => void;
  onToggleStockStatus: (index: number) => void;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, index, onUpdateOrder, onDeleteOrder, onToggleStockStatus }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedRoute, setEditedRoute] = useState(order.route);
  const [editedProduct, setEditedProduct] = useState(order.product);
  const [editedTrays, setEditedTrays] = useState(order.trays.toString());

  const handleSave = () => {
    const traysAsNumber = parseInt(editedTrays, 10);
    if (!isNaN(traysAsNumber) && traysAsNumber >= 0 && editedProduct.trim() !== '' && editedRoute.trim() !== '') {
      onUpdateOrder(index, editedRoute.trim(), editedProduct.trim(), traysAsNumber);
      setIsEditing(false);
    } else {
      alert("Please enter a valid route, product name, and a non-negative number for trays.");
    }
  };

  const handleCancel = () => {
    setEditedRoute(order.route);
    setEditedProduct(order.product);
    setEditedTrays(order.trays.toString());
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="bg-white rounded-lg shadow-lg ring-2 ring-blue-500 border border-blue-200 overflow-hidden">
        <div className="p-5">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500 block mb-1">Route / Location</label>
              <input 
                type="text" 
                value={editedRoute}
                onChange={(e) => setEditedRoute(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 block mb-1">Product</label>
              <input 
                type="text" 
                value={editedProduct}
                onChange={(e) => setEditedProduct(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 block mb-1">Trays</label>
              <input 
                type="number"
                value={editedTrays}
                onChange={(e) => setEditedTrays(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-6">
            <button onClick={handleCancel} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg">Cancel</button>
            <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">Save</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 overflow-hidden transform hover:-translate-y-1 ${order.inStock ? 'opacity-60 bg-gray-50' : ''}`}>
      <div className="p-5 relative">
        <div className="absolute top-3 right-3 flex items-center gap-1">
          <button 
            onClick={() => setIsEditing(true)}
            className="p-2 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            aria-label="Edit order"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
              <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
            </svg>
          </button>
           <button 
            onClick={() => onDeleteOrder(index)}
            className="p-2 rounded-full text-gray-400 hover:bg-red-100 hover:text-red-600 transition-colors"
            aria-label="Delete order"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <div className="flex items-center mb-3">
          <div className="p-2 bg-blue-100 rounded-full mr-3">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 2h8a1 1 0 001-1zM3 11h10" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-800 truncate">{order.route}</h3>
        </div>
        
        <div className="space-y-3 mt-4 text-gray-600">
           <div className="flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mt-0.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <div>
              <p className="text-sm font-medium text-gray-500">Product</p>
              <p className="font-semibold">{order.product}</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mt-0.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            <div>
              <p className="text-sm font-medium text-gray-500">Trays</p>
              <p className="font-semibold text-2xl text-blue-600">{order.trays}</p>
            </div>
          </div>
        </div>
      </div>

       <div className="border-t border-gray-200 p-3 bg-gray-50">
          <div className="flex items-center justify-between">
            <label htmlFor={`stock-toggle-${index}`} className="text-sm font-medium text-gray-600 cursor-pointer">
              In Stock
            </label>
            <button
              role="switch"
              aria-checked={order.inStock}
              id={`stock-toggle-${index}`}
              onClick={() => onToggleStockStatus(index)}
              className={`${
                order.inStock ? 'bg-green-500' : 'bg-gray-200'
              } relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            >
              <span
                className={`${
                  order.inStock ? 'translate-x-6' : 'translate-x-1'
                } inline-block w-4 h-4 transform bg-white rounded-full transition-transform`}
              />
            </button>
          </div>
        </div>

    </div>
  );
};

export default OrderCard;