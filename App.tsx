
import React, { useState } from 'react';
import Header from './components/Header';
import Splitter from './components/Splitter';
import Merger from './components/Merger';
import Compressor from './components/Compressor';
import Rotator from './components/Rotator';
import PdfToJpg from './components/PdfToJpg';
import PdfToText from './components/PdfToText';

type Tool = 'split' | 'merge' | 'compress' | 'rotate' | 'pdf-to-jpg' | 'pdf-to-text';

const App: React.FC = () => {
  const [activeTool, setActiveTool] = useState<Tool>('split');

  const renderTool = () => {
    switch (activeTool) {
      case 'split':
        return <Splitter />;
      case 'merge':
        return <Merger />;
      case 'compress':
        return <Compressor />;
      case 'rotate':
        return <Rotator />;
      case 'pdf-to-jpg':
        return <PdfToJpg />;
      case 'pdf-to-text':
        return <PdfToText />;
      default:
        return <Splitter />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center">
      <main className="container mx-auto p-4 md:p-8 w-full max-w-6xl">
        <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800">
                PDF Toolkit <span className="text-blue-600">Pro</span>
            </h1>
            <p className="mt-4 text-lg text-slate-500">
                Your one-stop solution for splitting, merging, and editing PDF documents effortlessly.
            </p>
        </div>

        <div className="bg-white rounded-xl shadow-2xl shadow-slate-200 ring-1 ring-slate-100 p-2">
            <Header activeTool={activeTool} setActiveTool={setActiveTool} />
            <div className="p-4 sm:p-8">
                {renderTool()}
            </div>
        </div>

        <footer className="text-center mt-12 text-slate-400 text-sm">
            <p>&copy; {new Date().getFullYear()} PDF Toolkit Pro. All Rights Reserved.</p>
        </footer>
      </main>
    </div>
  );
};

export default App;
