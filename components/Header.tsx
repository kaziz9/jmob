import React from 'react';

interface HeaderProps {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
}

const Header: React.FC<HeaderProps> = ({ selectedDate, setSelectedDate }) => {
  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-2 flex justify-between items-center">
        {/* Left Side: Date Picker */}
        <div className="w-48">
          <input
            type="date"
            id="header-issue-date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Center: Title */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800 tracking-tight">
            Processor of Bulk Orders
          </h1>
          <p className="text-sm font-medium text-gray-500">
            for Johnston Mooney & O'Brien
          </p>
        </div>

        {/* Right Side: Spacer */}
        <div className="w-48"></div>
      </div>
    </header>
  );
};

export default Header;