import React, { ReactNode } from 'react';

interface PdfPageGridProps {
    totalPages: number;
    children: (pageNumber: number) => ReactNode;
}

const PdfPageGrid: React.FC<PdfPageGridProps> = ({ totalPages, children }) => {
    return (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 max-h-[500px] overflow-y-auto p-4 bg-slate-50 rounded-lg border">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNumber => (
                <React.Fragment key={pageNumber}>
                    {children(pageNumber)}
                </React.Fragment>
            ))}
        </div>
    );
};

export default PdfPageGrid;