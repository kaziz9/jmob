import React, { useState, useCallback, useEffect } from 'react';
import { OrderData, Order } from './types';
import { extractOrderDataFromFile } from './services/geminiService';
import Header from './components/Header';
import OrderCard from './components/OrderCard';
import PrintableReport from './components/PrintableReport';
import FileUpload from './components/FileUpload';
import LoadingSpinner from './components/LoadingSpinner';
import CameraCapture from './components/CameraCapture';
import PDFTextExtractor from './components/PDFTextExtractor';

declare const jspdf: any;
declare const html2canvas: any;

const cleanProductName = (productName: string): string => {
  if (!productName) return '';
  let cleaned = productName;
  // Remove leading alphanumeric code (e.g., "B441 ")
  cleaned = cleaned.replace(/^[A-Z0-9]+\s/, '');
  // Remove "Tray" and any following numbers from the end, case-insensitive
  cleaned = cleaned.replace(/\s*Tray\s*\d*$/i, '');
  return cleaned.trim();
};

const FileIcon = ({ file }: { file: File }) => {
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  if (extension === 'pdf') {
    return (
      <div className="text-center text-red-600">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 11-2 0V4h-3v5a1 1 0 01-1 1H8a1 1 0 01-1-1V4H4v12a2 2 0 002 2h8a2 2 0 002-2v-2a1 1 0 112 0v2a4 4 0 01-4 4H6a4 4 0 01-4-4V4z" clipRule="evenodd" />
        </svg>
        <span className="block text-xs font-semibold mt-1 truncate">{file.name}</span>
      </div>
    );
  }

  if (extension === 'docx') {
    return (
      <div className="text-center text-blue-600">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm5 2a1 1 0 00-1 1v1a1 1 0 001 1h2a1 1 0 001-1V7a1 1 0 00-1-1H9zM8 11a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1zm1 3a1 1 0 100 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
        </svg>
        <span className="block text-xs font-semibold mt-1 truncate">{file.name}</span>
      </div>
    );
  }
  
  return (
      <div className="text-center text-gray-500">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
        </svg>
        <span className="block text-xs font-semibold mt-1 truncate">{file.name}</span>
      </div>
  )
};


const App: React.FC = () => {
  const [orderData, setOrderData] = useState<OrderData>({
    issueDate: '',
    orders: []
  });
  const [isPreviewing, setIsPreviewing] = useState<boolean>(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [globalProduct, setGlobalProduct] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [sliceMode, setSliceMode] = useState<'single' | 'double'>('double');
  
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [isPdfExtractorOpen, setIsPdfExtractorOpen] = useState<boolean>(false);


  useEffect(() => {
    // Clean up preview URLs when component unmounts or files change
    return () => {
      previewUrls.forEach(URL.revokeObjectURL);
    };
  }, [previewUrls]);

  const handleFileSelect = (newFiles: File[]) => {
    const allFiles = [...files, ...newFiles];
    setFiles(allFiles);

    const newUrls = newFiles.map(file => URL.createObjectURL(file));
    setPreviewUrls(prev => [...prev, ...newUrls]);
  };

  const handleRemoveFile = (indexToRemove: number) => {
    setFiles(files.filter((_, index) => index !== indexToRemove));
    setPreviewUrls(prev => {
      URL.revokeObjectURL(prev[indexToRemove]);
      return prev.filter((_, index) => index !== indexToRemove);
    });
  };

  const handleCaptureScreen = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'never' } as any,
        audio: false,
      });
      const videoTrack = stream.getVideoTracks()[0];
      const imageCapture = new (window as any).ImageCapture(videoTrack);
      const blob = await imageCapture.grabFrame();
      videoTrack.stop(); // Important to stop the track

      const fileName = `screenshot-${new Date().toISOString()}.png`;
      const file = new File([blob], fileName, { type: 'image/png' });
      handleFileSelect([file]);
    } catch (err: any) {
      console.error('Error capturing screen:', err);
      if (err.name !== 'NotAllowedError') {
        setError('Could not capture the screen. Your browser might not support this feature.');
      }
    }
  };
  
  const aggregateOrders = (orders: Order[]): Order[] => {
    const aggregated: { [key: string]: Order } = {};

    orders.forEach(order => {
      const key = `${order.route.toLowerCase().trim()}-${order.product.toLowerCase().trim()}`;
      if (aggregated[key]) {
        aggregated[key].trays += order.trays;
      } else {
        aggregated[key] = { ...order, inStock: order.inStock || false };
      }
    });

    const sortedOrders = Object.values(aggregated);
    sortedOrders.sort((a, b) => a.route.localeCompare(b.route));
    return sortedOrders;
  };
  
  const processFiles = async () => {
    if (files.length === 0) return;
    
    setIsLoading(true);
    setError(null);

    const results = await Promise.allSettled(
      files.map(file => extractOrderDataFromFile(file))
    );

    let allOrders: Order[] = [];
    let foundDate: string | null = null;
    let anySuccessful = false;
    let errors: string[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.orders) {
        const cleanedOrders = result.value.orders.map(order => ({
          ...order,
          product: cleanProductName(order.product),
          inStock: false
        }));

        allOrders = [...allOrders, ...cleanedOrders];
        if (result.value.issueDate && !foundDate) {
          foundDate = result.value.issueDate;
        }
        anySuccessful = true;
      } else if (result.status === 'rejected') {
        const reason = result.reason?.message || 'Please check the console.';
        console.error(`Error processing file ${files[index].name}:`, result.reason);
        errors.push(`Error with ${files[index].name}: ${reason}`);
      }
    });

    if (anySuccessful) {
        const finalAggregatedOrders = aggregateOrders(allOrders);
        const dateToUse = new Date(selectedDate + 'T00:00:00')
          .toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
          
        setOrderData({
            issueDate: dateToUse,
            orders: finalAggregatedOrders
        });
        
        const firstProduct = finalAggregatedOrders[0]?.product;
        if (firstProduct) {
            setGlobalProduct(firstProduct);
        }
    }
    
    if (errors.length > 0) {
        setError(errors.join('\n'));
    }

    if (!anySuccessful && errors.length === 0) {
         setError("Could not extract any order data from the provided documents.");
    }
    
    setIsLoading(false);
  };


  const handleDeleteOrder = useCallback((indexToDelete: number) => {
    setOrderData(prevData => ({
      ...prevData,
      orders: prevData.orders.filter((_, index) => index !== indexToDelete)
    }));
  }, []);
  
  const handleUpdateOrder = (index: number, newRoute: string, newProduct: string, newTrays: number) => {
    const updatedOrders = [...orderData.orders];
    updatedOrders[index] = { ...updatedOrders[index], route: newRoute, product: newProduct, trays: newTrays };
    setOrderData({ ...orderData, orders: updatedOrders });
  };
  
  const handleToggleStockStatus = useCallback((indexToToggle: number) => {
    setOrderData(prevData => {
      const updatedOrders = prevData.orders.map((order, index) => {
        if (index === indexToToggle) {
          return { ...order, inStock: !order.inStock };
        }
        return order;
      });
      return { ...prevData, orders: updatedOrders };
    });
  }, []);

  const handleApplyProductToAll = () => {
    if (!globalProduct.trim()) return;
    const updatedOrders = orderData.orders.map(order => ({
      ...order,
      product: globalProduct.trim()
    }));
    setOrderData({ ...orderData, orders: updatedOrders });
  };

  const handleAddNewOrder = () => {
    const newOrder: Order = {
      route: 'New Route',
      product: globalProduct || 'New Product',
      trays: 0,
      inStock: false,
    };

    setOrderData(prevData => ({
      ...prevData,
      orders: [...prevData.orders, newOrder]
    }));
  };
  
  const handleSaveAsPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const { jsPDF } = jspdf;
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4' // A4 size: 210mm x 297mm
      });
      
      const reportElement = document.querySelector('.printable-area');
      if (!reportElement) {
        throw new Error('Printable report not found.');
      }
      
      const pages = reportElement.querySelectorAll('.printable-page');
       if (pages.length === 0) {
        alert('No pages found to generate PDF.');
        return;
      }
      
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i] as HTMLElement;
        
        // Temporarily remove box-shadow for cleaner capture
        const originalShadow = page.style.boxShadow;
        page.style.boxShadow = 'none';
        
        const canvas = await html2canvas(page, {
            scale: 2, // Use a higher scale for better resolution
            useCORS: true,
            logging: false
        });

        // Restore styles
        page.style.boxShadow = originalShadow;

        const imgData = canvas.toDataURL('image/png');
        
        // Add the image to the PDF
        if (i > 0) {
          pdf.addPage('a4', 'portrait');
        }
        pdf.addImage(imgData, 'PNG', 0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight());
      }
      
      pdf.save(`Order_Report_${selectedDate}.pdf`);

    } catch (err: any) {
        console.error("Failed to generate PDF:", err);
        alert("Sorry, there was an error creating the PDF file. Please try again.");
    } finally {
        setIsGeneratingPdf(false);
    }
  };

  const handlePrint = () => window.print();

  const resetState = () => {
    setOrderData({ issueDate: '', orders: [] });
    setIsPreviewing(false);
    setGlobalProduct('');
    setFiles([]);
    setPreviewUrls(urls => {
      urls.forEach(URL.revokeObjectURL);
      return [];
    });
    setError(null);
    setIsLoading(false);
  };

  const renderMainView = () => {
      if (orderData.orders.length > 0) {
        const uniqueProducts = [...new Set(orderData.orders.map(o => o.product))];

        return (
          <div className="max-w-7xl mx-auto">
            {/* --- Control Panel --- */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 mb-8 flex flex-col md:flex-row justify-between gap-8">
                {/* Left Side: Settings */}
                <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-700 mb-4 border-b pb-2">Batch Settings</h3>
                    <div className="space-y-6">
                        {/* Global Product Editor */}
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-2">Global Product Name</label>
                            <div className="flex flex-col sm:flex-row items-stretch gap-2">
                                <input 
                                    type="text" 
                                    value={globalProduct}
                                    onChange={(e) => setGlobalProduct(e.target.value)}
                                    placeholder="Enter product name"
                                    className="flex-grow w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <button 
                                    onClick={handleApplyProductToAll}
                                    disabled={!globalProduct.trim()}
                                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                    Apply to All
                                </button>
                            </div>
                            {uniqueProducts.length > 0 && (
                                <div className="mt-3">
                                    <div className="inline-flex flex-wrap gap-2">
                                        {uniqueProducts.map(p => (
                                            <button key={p} onClick={() => setGlobalProduct(p)} className="bg-gray-100 text-gray-800 text-xs font-semibold px-2.5 py-1 rounded-full hover:bg-gray-200 transition-colors">Set to "{p}"</button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        {/* Slice Type */}
                        <div>
                             <label className="block text-sm font-medium text-gray-600 mb-2">Slice Type</label>
                             <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1 border border-gray-200 w-fit">
                                <button onClick={() => setSliceMode('double')} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${sliceMode === 'double' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}>
                                    Double (60)
                                </button>
                                <button onClick={() => setSliceMode('single')} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${sliceMode === 'single' ? 'bg-green-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}>
                                    Single (100)
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Actions */}
                <div className="md:w-56 md:border-l md:pl-8">
                    <h3 className="text-xl font-bold text-gray-700 mb-4 border-b pb-2">Actions</h3>
                    <div className="flex flex-col gap-3">
                        <button 
                            onClick={() => setIsPreviewing(true)}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300 flex items-center justify-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
                            Preview & Print
                        </button>
                        <button 
                            onClick={handleAddNewOrder}
                            className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-gray-300 flex items-center justify-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                            Add New Order
                        </button>
                        <button 
                            onClick={resetState} 
                            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-red-300"
                        >
                            Start New Batch
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {orderData.orders.map((order, index) => (
                <OrderCard 
                  key={`${order.route}-${index}`} 
                  order={order} 
                  index={index}
                  onUpdateOrder={handleUpdateOrder}
                  onDeleteOrder={handleDeleteOrder}
                  onToggleStockStatus={handleToggleStockStatus}
                />
              ))}
            </div>
          </div>
        );
      }

      // Initial View
      return (
         <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-6 md:p-8 border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-700 mb-2 text-center">Upload and Process Files</h2>
            
            <div className="mt-8">
                <FileUpload
                  onFileSelect={handleFileSelect}
                  onTakePhoto={() => setIsCameraOpen(true)}
                  onCaptureScreen={handleCaptureScreen}
                  onExtractPdf={() => setIsPdfExtractorOpen(true)}
                />
            </div>


            {isLoading && <LoadingSpinner />}
            {error && <div className="mt-4 text-center text-red-600 bg-red-100 p-3 rounded-lg whitespace-pre-wrap">{error}</div>}
            
            {files.length > 0 && !isLoading && (
              <div className="mt-8">
                <h3 className="text-xl font-semibold text-gray-700 mb-4">File Queue ({files.length})</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {files.map((file, index) => (
                    <div key={index} className="relative group">
                       {file.type.startsWith('image/') ? (
                            <img src={previewUrls[index]} alt={`Preview ${file.name}`} className="w-full h-28 object-cover rounded-lg shadow-md" />
                        ) : (
                            <div className="w-full h-28 bg-gray-100 rounded-lg shadow-md flex items-center justify-center p-2 border border-gray-200">
                                <FileIcon file={file} />
                            </div>
                        )}
                      <button 
                        onClick={() => handleRemoveFile(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 leading-none w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Remove file"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
                 <div className="mt-8 text-center">
                    <button
                        onClick={processFiles}
                        disabled={isLoading}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-10 rounded-lg shadow-lg transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300 text-lg disabled:bg-gray-400 disabled:cursor-wait"
                    >
                        Process {files.length} File{files.length === 1 ? '' : 's'}
                    </button>
                 </div>
              </div>
            )}
        </div>
      );
  };

  const renderPreviewView = () => {
    // Apply the manually selected date to the order data for printing
    const dataForPrinting = {
      ...orderData,
      issueDate: new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
    };

    return (
        <div>
            <div className="no-print mb-6 p-4 bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
              <h2 className="text-2xl font-bold text-gray-700">Print Preview</h2>
              <div className="flex items-center gap-4 w-full sm:w-auto">
                 <button 
                    onClick={() => setIsPreviewing(false)} 
                    disabled={isGeneratingPdf}
                    className="w-full sm:w-auto bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-6 rounded-lg transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-gray-300 disabled:bg-gray-400"
                  >
                    Back to List
                  </button>
                  <button
                    onClick={handleSaveAsPdf}
                    disabled={isGeneratingPdf}
                    className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300 flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-wait"
                  >
                    {isGeneratingPdf ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Generating...
                        </>
                    ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                          Save as PDF
                        </>
                    )}
                  </button>
                  <button 
                    onClick={handlePrint} 
                    disabled={isGeneratingPdf}
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300 flex items-center justify-center gap-2 disabled:bg-gray-400"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v6a2 2 0 002 2h12a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" /></svg>
                    Print
                  </button>
              </div>
            </div>
          <PrintableReport data={dataForPrinting} sliceMode={sliceMode} />
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
       <div className={isPreviewing ? 'no-print' : ''}>
         <Header selectedDate={selectedDate} setSelectedDate={setSelectedDate} />
       </div>
      <main className="container mx-auto p-4 md:p-8">
        {isPreviewing ? renderPreviewView() : renderMainView()}
      </main>
      {isCameraOpen && (
        <CameraCapture
          onCapture={handleFileSelect}
          onClose={() => setIsCameraOpen(false)}
        />
      )}
      {isPdfExtractorOpen && (
        <PDFTextExtractor onClose={() => setIsPdfExtractorOpen(false)} />
      )}
    </div>
  );
};

export default App;