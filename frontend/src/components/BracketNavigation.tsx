import React, { useState } from 'react';
import { useMediaQuery } from 'react-responsive';
import { Regions } from '../utils/Types';

interface BracketNavigationProps {
    regions: Regions[];
    onRegionSelect: (region: Regions) => void;
}

const BracketNavigation: React.FC<BracketNavigationProps> = ({ regions, onRegionSelect }) => {
    const isDesktop = useMediaQuery({ minWidth: 1024 });
    const [isOpen, setIsOpen] = useState(false);

    if (isDesktop) {
        return (
            <nav className="flex justify-center gap-8">
                {regions.map((region) => (
                    <a
                        key={region}
                        href={`#${region}`}
                        onClick={(e) => {
                            e.preventDefault();
                            onRegionSelect(region);
                        }}
                        className="text-indigo-600 hover:text-indigo-800 transition-colors font-medium"
                    >
                        {region} Region
                    </a>
                ))}
            </nav>
        );
    }

    return (
        <div className="w-full">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-3 py-2 text-gray-500 bg-white hover:bg-gray-50 rounded-md transition-colors font-medium flex items-center justify-between border border-gray-200"
            >
                <span className="truncate">Jump to Region</span>
                <svg 
                    className={`w-5 h-5 transition-transform flex-shrink-0 ml-2 text-gray-400 ${isOpen ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {isOpen && (
                <nav className="absolute left-2 right-2 mt-1 bg-white rounded-md shadow-lg overflow-hidden z-50 border border-gray-200">
                    {regions.map((region) => (
                        <a
                            key={region}
                            href={`#${region}`}
                            onClick={(e) => {
                                e.preventDefault();
                                onRegionSelect(region);
                                setIsOpen(false);
                            }}
                            className="block w-full px-4 py-2 text-indigo-600 hover:text-indigo-800 hover:bg-gray-50 transition-colors font-medium"
                        >
                            {region} Region
                        </a>
                    ))}
                </nav>
            )}
        </div>
    );
};

export default BracketNavigation; 