import React, { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { blogService } from '../../services/blogService';
import type { Blog } from '../../types/blog';

interface BlogSearchProps {
  onSearchResults: (blogs: Blog[]) => void;
  onSearching: (isSearching: boolean) => void;
  onClear?: () => void;
  placeholder?: string;
  className?: string;
}

const BlogSearch: React.FC<BlogSearchProps> = ({
  onSearchResults,
  onSearching,
  onClear,
  placeholder = "Tìm kiếm bài viết...",
  className = ""
}) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Load search history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('blogSearchHistory');
    if (saved) {
      try {
        setSearchHistory(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading search history:', error);
      }
    }
  }, []);

  // Save search history to localStorage
  const saveSearchHistory = (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    
    const newHistory = [searchTerm, ...searchHistory.filter(term => term !== searchTerm)].slice(0, 5);
    setSearchHistory(newHistory);
    localStorage.setItem('blogSearchHistory', JSON.stringify(newHistory));
  };

  const handleSearch = async (searchQuery: string = query) => {
    if (!searchQuery.trim()) {
      onSearchResults([]);
      setShowHistory(false);
      return;
    }

    setIsSearching(true);
    onSearching(true);
    setShowHistory(false);

    try {
      const results = await blogService.searchBlogs(searchQuery);
      onSearchResults(results);
      saveSearchHistory(searchQuery);
    } catch (error) {
      console.error('Search error:', error);
      onSearchResults([]);
    } finally {
      setIsSearching(false);
      onSearching(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  };

  const handleClear = () => {
    setQuery('');
    setShowHistory(false);
    if (onClear) {
      onClear();
    }
  };

  const handleClearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('blogSearchHistory');
    setShowHistory(false);
  };

  const handleHistoryClick = (term: string) => {
    setQuery(term);
    handleSearch(term);
  };

  const handleInputFocus = () => {
    if (searchHistory.length > 0) {
      setShowHistory(true);
    }
  };

  const handleInputBlur = () => {
    // Delay hiding history to allow clicks
    setTimeout(() => setShowHistory(false), 200);
  };

  return (
    <div className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            placeholder={placeholder}
            className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}
        </div>
        
        <button
          type="submit"
          disabled={isSearching || !query.trim()}
          className="w-full bg-green-600 text-white py-2.5 px-4 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
        >
          {isSearching ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Đang tìm kiếm...
            </span>
          ) : (
            'Tìm kiếm'
          )}
        </button>
      </form>

      {/* Search History */}
      {showHistory && searchHistory.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
          <div className="p-3 border-b border-gray-100 flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700">Tìm kiếm gần đây</h4>
            <button
              onClick={handleClearHistory}
              className="text-xs text-gray-500 hover:text-red-600 transition-colors"
            >
              Xóa lịch sử
            </button>
          </div>
          <div className="py-1">
            {searchHistory.map((term, index) => (
              <button
                key={index}
                onClick={() => handleHistoryClick(term)}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center transition-colors"
              >
                <MagnifyingGlassIcon className="w-4 h-4 mr-2 text-gray-400" />
                {term}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogSearch;
