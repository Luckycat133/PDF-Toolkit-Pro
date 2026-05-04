import React from 'react';
import { ScissorsIcon, DocumentDuplicateIcon, ArrowPathIcon, PhotoIcon, ArrowsPointingOutIcon, DocumentTextIcon } from './icons/EditorIcons';

type Tool = 'split' | 'merge' | 'compress' | 'rotate' | 'pdf-to-jpg' | 'pdf-to-text';

interface HeaderProps {
  activeTool: Tool;
  setActiveTool: (tool: Tool) => void;
}

const Header: React.FC<HeaderProps> = ({ activeTool, setActiveTool }) => {
  const tools = [
    { id: 'split', name: 'Split PDF', icon: <ScissorsIcon className="w-5 h-5 mr-2" /> },
    { id: 'merge', name: 'Merge PDF', icon: <DocumentDuplicateIcon className="w-5 h-5 mr-2" /> },
    { id: 'compress', name: 'Compress PDF', icon: <ArrowsPointingOutIcon className="w-5 h-5 mr-2" /> },
    { id: 'rotate', name: 'Rotate PDF', icon: <ArrowPathIcon className="w-5 h-5 mr-2" /> },
    { id: 'pdf-to-jpg', name: 'PDF to JPG', icon: <PhotoIcon className="w-5 h-5 mr-2" /> },
    { id: 'pdf-to-text', name: 'PDF to Text', icon: <DocumentTextIcon className="w-5 h-5 mr-2" /> },
  ];

  return (
    <header className="flex flex-wrap items-center justify-center border-b border-slate-200 bg-slate-50/80 rounded-t-lg p-2 gap-2">
      {tools.map(tool => (
        <button
          key={tool.id}
          onClick={() => setActiveTool(tool.id as Tool)}
          className={`
            flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-md transition-all duration-200
            ${activeTool === tool.id
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-200'
            }
          `}
        >
          {tool.icon}
          {tool.name}
        </button>
      ))}
    </header>
  );
};

export default Header;