import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import { serviceService } from '../services/serviceService';
import ServiceCard from '../components/ServiceCard';
import './Services.css';

const SORT_OPTIONS = [
  { value: '', label: 'Default' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'popular', label: 'Most Popular' },
];

const Services = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    minPrice: '',
    maxPrice: '',
    minRating: '',
    sort: '',
    page: 1,
  });

  useEffect(() => {
    serviceService.getCategories().then((res) => setCategories(res.data.categories || []));
  }, []);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const params = { ...filters, limit: 12 };
      Object.keys(params).forEach((k) => !params[k] && delete params[k]);
      const res = await serviceService.getAll(params);
      setServices(res.data.services || []);
      setTotalPages(res.data.totalPages || 1);
      setTotal(res.data.total || 0);
    } catch {
      setServices([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({ search: '', category: '', minPrice: '', maxPrice: '', minRating: '', sort: '', page: 1 });
    setSearchParams({});
  };

  const hasActiveFilters = filters.search || filters.category || filters.minPrice || filters.maxPrice || filters.minRating || filters.sort;

  return (
    <div className="services-page">
      {/* Page Hero */}
      <div className="page-hero">
        <h1>All Services</h1>
        <p>Browse and book from our wide range of professional home services</p>
      </div>

      <div className="container services-layout">
        {/* Sidebar Filters */}
        <aside className={`filters-sidebar ${showFilters ? 'open' : ''}`}>
          <div className="filter-header">
            <h3>Filters</h3>
            {hasActiveFilters && (
              <button className="clear-filters" onClick={clearFilters}>
                <X size={14} /> Clear all
              </button>
            )}
          </div>

          {/* Search */}
          <div className="filter-group">
            <label className="filter-label">Search</label>
            <div className="filter-search">
              <Search size={15} />
              <input
                type="text"
                placeholder="Search services..."
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
              />
            </div>
          </div>

          {/* Category */}
          <div className="filter-group">
            <label className="filter-label">Category</label>
            <div className="filter-category-list">
              <button
                className={`filter-cat-btn ${!filters.category ? 'active' : ''}`}
                onClick={() => updateFilter('category', '')}
              >
                All Categories
              </button>
              {categories.map((cat) => (
                <button
                  key={cat._id}
                  className={`filter-cat-btn ${filters.category === cat._id ? 'active' : ''}`}
                  onClick={() => updateFilter('category', cat._id)}
                >
                  {cat.categoryName}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div className="filter-group">
            <label className="filter-label">Price Range</label>
            <div className="price-range">
              <input
                type="number"
                placeholder="Min $"
                value={filters.minPrice}
                onChange={(e) => updateFilter('minPrice', e.target.value)}
                min="0"
              />
              <span>—</span>
              <input
                type="number"
                placeholder="Max $"
                value={filters.maxPrice}
                onChange={(e) => updateFilter('maxPrice', e.target.value)}
                min="0"
              />
            </div>
          </div>

          {/* Rating */}
          <div className="filter-group">
            <label className="filter-label">Minimum Rating</label>
            <div className="rating-filter">
              {[4, 3, 2, 1].map((r) => (
                <button
                  key={r}
                  className={`filter-rating-btn ${filters.minRating === String(r) ? 'active' : ''}`}
                  onClick={() => updateFilter('minRating', filters.minRating === String(r) ? '' : String(r))}
                >
                  {'⭐'.repeat(r)} & up
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="services-main">
          {/* Toolbar */}
          <div className="services-toolbar">
            <div className="toolbar-left">
              <button className="filter-toggle-btn" onClick={() => setShowFilters(!showFilters)}>
                <SlidersHorizontal size={16} /> Filters
              </button>
              <span className="result-count">
                {loading ? 'Loading...' : `${total} service${total !== 1 ? 's' : ''} found`}
              </span>
            </div>
            <div className="toolbar-right">
              <div className="sort-select">
                <ChevronDown size={14} />
                <select
                  value={filters.sort}
                  onChange={(e) => updateFilter('sort', e.target.value)}
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Active Filters Tags */}
          {hasActiveFilters && (
            <div className="active-filters">
              {filters.search && (
                <span className="filter-tag">
                  Search: "{filters.search}" <button onClick={() => updateFilter('search', '')}><X size={12} /></button>
                </span>
              )}
              {filters.category && (
                <span className="filter-tag">
                  {categories.find(c => c._id === filters.category)?.categoryName}
                  <button onClick={() => updateFilter('category', '')}><X size={12} /></button>
                </span>
              )}
              {filters.minRating && (
                <span className="filter-tag">
                  {filters.minRating}+ Stars <button onClick={() => updateFilter('minRating', '')}><X size={12} /></button>
                </span>
              )}
            </div>
          )}

          {/* Services Grid */}
          {loading ? (
            <div className="loading-center" style={{ minHeight: '300px' }}>
              <div className="spinner" />
              <p style={{ color: 'var(--text-secondary)' }}>Loading services...</p>
            </div>
          ) : services.length > 0 ? (
            <>
              <div className="services-grid">
                {services.map((s) => (
                  <ServiceCard key={s._id} service={s} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    className="page-btn"
                    disabled={filters.page === 1}
                    onClick={() => setFilters((p) => ({ ...p, page: p.page - 1 }))}
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      className={`page-btn ${filters.page === p ? 'active' : ''}`}
                      onClick={() => setFilters((prev) => ({ ...prev, page: p }))}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    className="page-btn"
                    disabled={filters.page === totalPages}
                    onClick={() => setFilters((p) => ({ ...p, page: p.page + 1 }))}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <h3>No services found</h3>
              <p>Try adjusting your search or filters</p>
              <button className="btn btn-primary" onClick={clearFilters}>Clear Filters</button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Services;
