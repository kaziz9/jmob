import React, { useState } from 'react';

interface OrderEntryFormProps {
  onAddOrder: (order: { route: string; product: string; trays: number }) => void;
  defaultProduct: string;
}

const routesList = [
  "ATHLONE",
  "BALLINA DEPOT",
  "BUCKLEY GALWAY",
  "BUCKLEY LIMERICK",
  "BUCKLEY PORTLAOISE",
  "Carlow",
  "DUBLIN BULK",
  "FINNERTY",
  "KILBEGGAN",
  "LONGFORD",
  "NAVAN",
  "Shercock",
];

const OrderEntryForm: React.FC<OrderEntryFormProps> = ({ onAddOrder, defaultProduct }) => {
  const [route, setRoute] = useState('');
  const [product, setProduct] = useState(defaultProduct || '');
  const [trays, setTrays] = useState('');

  // Update the local product state if the global default changes
  React.useEffect(() => {
    setProduct(defaultProduct);
  }, [defaultProduct]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const traysAsNumber = parseInt(trays, 10);
    if (route.trim() && product.trim() && !isNaN(traysAsNumber) && traysAsNumber > 0) {
      onAddOrder({ route: route.trim(), product: product.trim(), trays: traysAsNumber });
      // Clear route and trays, but keep product for faster entry of the same type
      setRoute('');
      setTrays('');
      document.getElementById('route')?.focus();
    } else {
      alert('Please fill out all fields with valid data.');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 border border-gray-200 mb-8 max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Add New Order</h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
        <div className="md:col-span-2">
          <label htmlFor="route" className="block text-sm font-medium text-gray-700 mb-1">Route / Location</label>
          <input
            type="text"
            id="route"
            list="route-list"
            value={route}
            onChange={(e) => setRoute(e.target.value)}
            placeholder="e.g., ATHLONE, FINNERTY"
            className="w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <datalist id="route-list">
            {routesList.map(routeName => (
              <option key={routeName} value={routeName} />
            ))}
          </datalist>
        </div>
        <div className="md:col-span-2">
          <label htmlFor="product" className="block text-sm font-medium text-gray-700 mb-1">Product</label>
          <input
            type="text"
            id="product"
            value={product}
            onChange={(e) => setProduct(e.target.value)}
            placeholder="e.g., 4&quot; Regular Tray 60"
            className="w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label htmlFor="trays" className="block text-sm font-medium text-gray-700 mb-1">Trays</label>
          <input
            type="number"
            id="trays"
            value={trays}
            onChange={(e) => setTrays(e.target.value)}
            placeholder="e.g., 15"
            min="1"
            className="w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div className="md:col-start-5">
            <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300 flex items-center justify-center gap-2"
            >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add Order
            </button>
        </div>
      </form>
    </div>
  );
};

export default OrderEntryForm;