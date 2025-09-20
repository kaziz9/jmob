import React from 'react';
import { OrderData, Order } from '../types';

interface PrintableReportProps {
  data: OrderData;
  sliceMode: 'single' | 'double';
}

interface PageOrder extends Order {
  pageKey: string;
  pageNumber: number;
  totalPages: number;
}

const getPrimaryProductName = (orders: Order[]): string => {
    if (!orders || orders.length === 0) return 'N/A';
    
    // Count occurrences of each product name
    const productCounts = orders.reduce((acc, order) => {
        acc[order.product] = (acc[order.product] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    // Find the product name with the highest count
    const primaryProduct = Object.keys(productCounts).reduce((a, b) => productCounts[a] > productCounts[b] ? a : b);
    
    return primaryProduct;
};

const getProductFontSizeClass = (productName: string): string => {
  const length = productName.length;
  if (length <= 18) return 'text-5xl';
  if (length <= 22) return 'text-4xl';
  if (length <= 28) return 'text-3xl';
  if (length <= 35) return 'text-2xl';
  if (length <= 45) return 'text-xl';
  return 'text-lg'; // For very long product names, allows wrapping between words
};

const getRouteFontSizeClass = (routeName: string): string => {
  // Standardize the font size for all routes as requested.
  // Longer route names with spaces will wrap to the next line.
  return 'text-7xl';
};

const PrintableReport: React.FC<PrintableReportProps> = ({ data, sliceMode }) => {
  if (!data || !data.orders || data.orders.length === 0) return null;
  
  const currentTime = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true });

  // --- Summary Page Calculations ---
  
  // Helper to identify any order that will NOT be produced.
  const isExcludedFromProduction = (order: Order): boolean => 
    order.inStock || order.route.toUpperCase().trim() === 'IN STOCK';

  // First, filter out any orders with negative tray counts as they are always invalid.
  const validOrders = data.orders.filter(order => order.trays >= 0);

  // Calculate the total that needs to be produced.
  const ordersToProduce = validOrders.filter(order => !isExcludedFromProduction(order));
  const totalTraysToProduce = ordersToProduce.reduce((sum, order) => sum + order.trays, 0);
  
  const sortedOrdersForSummary = [...validOrders].sort((a, b) => {
    const aIsStock = a.route.toUpperCase().trim() === 'IN STOCK';
    const bIsStock = b.route.toUpperCase().trim() === 'IN STOCK';

    if (aIsStock && !bIsStock) return 1;
    if (!aIsStock && bIsStock) return -1;
    
    return a.route.localeCompare(b.route);
  });
  const primaryProduct = getPrimaryProductName(validOrders);

  const summaryPage = (
    <div key="summary-page" className="printable-page">
      <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-8 text-lg">
        <h2 className="font-bold text-xl">Johnston Mooney & O'Brien</h2>
        <div className="text-right">
            <p><strong>{data.issueDate}</strong></p>
            <p><strong>Time:</strong> {currentTime}</p>
        </div>
      </div>
      <h1 className="text-4xl font-extrabold text-center mb-8">Slice Order Summary</h1>
      
      <h2 className="text-2xl font-bold mb-2">Detailed Breakdown</h2>
      <p className="text-xl text-center font-semibold text-gray-700 mb-4">{primaryProduct}</p>
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-100 border-b border-gray-200">
            <tr>
              <th className="p-3 text-sm font-semibold tracking-wide">Route / Location</th>
              <th className="p-3 text-sm font-semibold tracking-wide">Product</th>
              <th className="p-3 text-sm font-semibold tracking-wide">.S</th>
              <th className="p-3 text-sm font-semibold tracking-wide text-right">Trays</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedOrdersForSummary.map((order, index) => {
              const isExcluded = isExcludedFromProduction(order);
              return (
                <tr key={`summary-${index}`} className={`hover:bg-gray-50 text-sm ${isExcluded ? 'text-gray-500' : 'text-gray-800'}`}>
                  <td className="p-3 font-medium">{order.route}</td>
                  <td className="p-3">{order.product}</td>
                  <td className="p-3">
                    {isExcluded && (
                      <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        In Stock
                      </span>
                    )}
                  </td>
                  <td className="p-3 font-bold text-right">{order.trays}</td>
                </tr>
              );
            })}
          </tbody>
           <tfoot className="border-t-2 border-gray-300 bg-gray-50">
             <tr>
                <td colSpan={3} className="p-3 font-bold text-md text-right">Total Trays (To Produce)</td>
                <td className="p-3 font-bold text-md text-right">{totalTraysToProduce}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );

  // --- Individual Production Slips Logic ---
  const generatedPages: PageOrder[] = data.orders.flatMap((order, index) => {
    // Only generate pages for items NOT in stock or with positive trays
    if (isExcludedFromProduction(order) || order.trays <= 0) {
        return [];
    }
      
    const maxTrays = sliceMode === 'single' ? 100 : 60;
    
    const totalPages = Math.ceil(order.trays / maxTrays);
    
    const pages: PageOrder[] = [];
    if (totalPages > 0) {
        let remainingTrays = order.trays;
        let pageNum = 1;
        while (remainingTrays > 0) {
            const traysForThisPage = Math.min(remainingTrays, maxTrays);
            pages.push({
                ...order,
                trays: traysForThisPage,
                pageKey: `${index}-${pageNum}`,
                pageNumber: pageNum,
                totalPages: totalPages
            });
            remainingTrays -= traysForThisPage;
            pageNum++;
        }
    }
    return pages;
  });

  const individualSlips = generatedPages.map((order) => (
    <div key={order.pageKey} className="printable-page flex items-center justify-center">
      <div className="w-full max-w-2xl flex flex-col text-center" style={{height: '100%'}}>
        
        {/* Header Section */}
        <div className="border-b-2 border-black pb-4 mb-4 flex justify-between items-start">
          <h2 className="text-xl font-bold text-left">Johnston Mooney & O'Brien</h2>
          <p className="text-lg font-semibold text-right">{data.issueDate}</p>
        </div>

        {/* Main Content */}
        <div className="flex-grow flex flex-col justify-center items-center space-y-8">
          
          {/* Route */}
          <div className="w-full">
            <p className="text-xl font-bold uppercase tracking-wider text-gray-700">Route Product:</p>
            <h1 className={`${getRouteFontSizeClass(order.route)} font-extrabold tracking-wide uppercase`}>
              {order.route}
            </h1>
          </div>

          {/* Product */}
          <div className="w-full border-t-2 border-b-2 border-dashed border-gray-400 py-6 my-4">
            <p className="text-xl font-bold uppercase tracking-wider text-gray-700">Product name:</p>
            <p className={`${getProductFontSizeClass(order.product)} font-semibold`}>
              {order.product}
            </p>
          </div>

          {/* Quantity */}
          <div className="w-full">
            <p className="text-xl font-bold uppercase tracking-wider text-gray-700">Quantity</p>
            <p className="text-[20rem] font-light leading-none tracking-tighter font-pingfang">
              {order.trays}
            </p>
          </div>
        </div>
        
        {/* Footer section with page number has been removed */}

      </div>
    </div>
  ));

  return (
    <div className="printable-area bg-gray-200 py-4">
      {summaryPage}
      {individualSlips}
    </div>
  );
};

export default PrintableReport;