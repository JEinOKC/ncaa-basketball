import React from 'react';
import { useMediaQuery } from 'react-responsive';

interface BracketLayoutProps {
    bracket: React.ReactNode;
    rankings: React.ReactNode;
    navigation: React.ReactNode;
    contextToggle: React.ReactNode;
}

const BracketLayout: React.FC<BracketLayoutProps> = ({ 
    bracket, 
    rankings, 
    navigation, 
    contextToggle
}) => {
    const isDesktop = useMediaQuery({ minWidth: 1024 });

    return (
        <div className="bg-gray-50">
            {/* Fixed Navigation */}
            <div className="fixed top-0 left-0 right-0 z-50 bg-gray-100 shadow-md">
                <div className="py-2 flex flex-col gap-2">
                    <div className="flex justify-center">
                        {contextToggle}
                    </div>
                    {navigation}
                </div>
            </div>

            {/* Main Content */}
            <div className={`${isDesktop ? 'pt-32' : 'pt-24'}`}>
                {!isDesktop ? (
                    <div className="flex flex-col space-y-4">
                        <div className="w-full px-4">
                            {bracket}
                        </div>
                        <div className="w-full px-4">
                            {rankings}
                        </div>
                    </div>
                ) : (
                    <div className="flex w-screen">
                        <div className="flex-auto pr-8">
                            {bracket}
                        </div>
                        <div className="w-[550px] flex-none px-4">
                            {rankings}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BracketLayout; 