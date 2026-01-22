import { useCallback, useState } from 'react';
import { Search, X, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface GallerySearchProps {
  onSearch: (query: string) => void;
  onFilterChange: (filters: FilterOptions) => void;
  totalImages: number;
  filteredCount: number;
}

export interface FilterOptions {
  searchQuery: string;
  sortBy: 'newest' | 'oldest' | 'title' | 'size';
  tags: string[];
  aspectRatio: 'all' | 'landscape' | 'portrait' | 'square';
}

export const GallerySearch = ({
  onSearch,
  onFilterChange,
  totalImages,
  filteredCount
}: GallerySearchProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title' | 'size'>('newest');
  const [aspectRatio, setAspectRatio] = useState<'all' | 'landscape' | 'portrait' | 'square'>('all');

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    onSearch(query);
    onFilterChange({
      searchQuery: query,
      sortBy,
      tags: [],
      aspectRatio
    });
  }, [onSearch, onFilterChange, sortBy, aspectRatio]);

  const handleSortChange = useCallback((newSort: typeof sortBy) => {
    setSortBy(newSort);
    onFilterChange({
      searchQuery,
      sortBy: newSort,
      tags: [],
      aspectRatio
    });
  }, [searchQuery, onFilterChange, aspectRatio]);

  const handleAspectRatioChange = useCallback((ratio: typeof aspectRatio) => {
    setAspectRatio(ratio);
    onFilterChange({
      searchQuery,
      sortBy,
      tags: [],
      aspectRatio: ratio
    });
  }, [searchQuery, sortBy, onFilterChange]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    onSearch('');
  }, [onSearch]);

  return (
    <div className="space-y-4 mb-8">
      {/* Search Bar */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          <Search className="w-5 h-5" />
        </div>
        <Input
          placeholder="Search by title, description, or tags..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10 pr-10 h-11 rounded-lg border border-border/50 bg-background/50 backdrop-blur-sm focus:bg-background transition-all"
        />
        {searchQuery && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Filter Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
            title={showFilters ? "Hide filters" : "Show filters"}
          >
            <Filter className="w-4 h-4" />
            Filters
          </Button>
          <span className="text-sm text-muted-foreground">
            {filteredCount} of {totalImages} images
          </span>
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-lg border border-border/50 bg-background/50 backdrop-blur-sm animate-in fade-in-50 duration-200">
          {/* Sort By */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase text-muted-foreground">
              Sort By
            </label>
            <div className="flex flex-col gap-2">
              {(['newest', 'oldest', 'title', 'size'] as const).map((option) => (
                <button
                  key={option}
                  onClick={() => handleSortChange(option)}
                  className={cn(
                    "px-3 py-2 rounded-md text-sm font-medium transition-all",
                    sortBy === option
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted/80"
                  )}
                >
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Aspect Ratio */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase text-muted-foreground">
              Aspect Ratio
            </label>
            <div className="flex flex-col gap-2">
              {(['all', 'landscape', 'portrait', 'square'] as const).map((ratio) => (
                <button
                  key={ratio}
                  onClick={() => handleAspectRatioChange(ratio)}
                  title={`Filter by ${ratio} aspect ratio`}
                  className={cn(
                    "px-3 py-2 rounded-md text-sm font-medium transition-all",
                    aspectRatio === ratio
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted/80"
                  )}
                >
                  {ratio.charAt(0).toUpperCase() + ratio.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase text-muted-foreground">
              Stats
            </label>
            <div className="space-y-1 text-sm">
              <p className="text-foreground">Total: <span className="font-semibold">{totalImages}</span></p>
              <p className="text-foreground">Filtered: <span className="font-semibold text-primary">{filteredCount}</span></p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
