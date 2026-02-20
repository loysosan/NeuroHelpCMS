import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useUserAuth } from '../../context/UserAuthContext';
import Header from '../../components/user/Header';
import BottomNavigation from '../../components/user/BottomNavigation';
import Footer from '../../components/user/Footer';
import SpecialistCard, { SpecialistData } from '../../components/user/SpecialistCard';
import SpecialistSearchForm, { SpecialistSearchValues } from '../../components/user/SpecialistSearchForm';

interface SearchResponse {
  specialists: SpecialistData[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const SearchResultsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { token, refreshAccessToken } = useUserAuth();

  const [specialists, setSpecialists] = useState<SpecialistData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // Parse search params from URL
  const getSearchFilters = (): SpecialistSearchValues => {
    return {
      q: searchParams.get('q') || '',
      specialization: searchParams.get('specialization') || '',
      city: searchParams.get('city') || '',
      format: searchParams.get('format') || '',
      minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
      maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
      minExperience: searchParams.get('minExp') ? Number(searchParams.get('minExp')) : undefined,
    };
  };

  // Convert URL params to API request params
  const buildApiParams = (page: number = 1) => {
    const params: any = {
      page,
      limit: 20,
    };

    const city = searchParams.get('city');
    if (city) params.city = city;

    const minPrice = searchParams.get('minPrice');
    if (minPrice) params.minRate = Number(minPrice);

    const maxPrice = searchParams.get('maxPrice');
    if (maxPrice) params.maxRate = Number(maxPrice);

    const minExp = searchParams.get('minExp');
    if (minExp) params.minExperience = Number(minExp);

    const maxExp = searchParams.get('maxExp');
    if (maxExp) params.maxExperience = Number(maxExp);

    const minAge = searchParams.get('minAge');
    if (minAge) params.minAge = Number(minAge);

    const maxAge = searchParams.get('maxAge');
    if (maxAge) params.maxAge = Number(maxAge);

    const minChildAge = searchParams.get('minChildAge');
    if (minChildAge) params.minChildAge = Number(minChildAge);

    const maxChildAge = searchParams.get('maxChildAge');
    if (maxChildAge) params.maxChildAge = Number(maxChildAge);

    const skillIds = searchParams.get('skillIds');
    if (skillIds) {
      params.skillIds = skillIds.split(',').map(id => Number(id));
    }

    return params;
  };

  // Fetch specialists from API
  const fetchSpecialists = async (page: number = 1) => {
    if (!token) {
      setError('Для пошуку спеціалістів потрібно увійти в систему');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = buildApiParams(page);
      const base = import.meta.env.VITE_API_URL || '';

      let response = await fetch(`${base}/api/users/search/specialists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(params),
      });

      // Handle token refresh
      if (response.status === 401) {
        const newToken = await refreshAccessToken();
        if (newToken) {
          response = await fetch(`${base}/api/users/search/specialists`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${newToken}`,
            },
            body: JSON.stringify(params),
          });
        } else {
          throw new Error('Сесія закінчилась. Будь ласка, увійдіть знову.');
        }
      }

      if (!response.ok) {
        throw new Error('Помилка при завантаженні спеціалістів');
      }

      const data: SearchResponse = await response.json();
      setSpecialists(data.specialists || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 0);
      setCurrentPage(data.page || 1);
    } catch (err: any) {
      setError(err.message || 'Невідома помилка');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchSpecialists(1);
  }, [searchParams, token]);

  // Handle new search from form
  const handleSearch = (values: SpecialistSearchValues) => {
    const params = new URLSearchParams();
    if (values.q) params.set('q', values.q);
    if (values.specialization) params.set('specialization', values.specialization);
    if (values.city) params.set('city', values.city);
    if (values.format) params.set('format', values.format);
    if (values.minPrice !== undefined) params.set('minPrice', String(values.minPrice));
    if (values.maxPrice !== undefined) params.set('maxPrice', String(values.maxPrice));
    if (values.minExperience !== undefined) params.set('minExp', String(values.minExperience));
    if (values.maxExperience !== undefined) params.set('maxExp', String(values.maxExperience));
    if (values.minAge !== undefined) params.set('minAge', String(values.minAge));
    if (values.maxAge !== undefined) params.set('maxAge', String(values.maxAge));
    if (values.minChildAge !== undefined) params.set('minChildAge', String(values.minChildAge));
    if (values.maxChildAge !== undefined) params.set('maxChildAge', String(values.maxChildAge));
    if (values.skillIds && values.skillIds.length > 0) params.set('skillIds', values.skillIds.join(','));

    setSearchParams(params);
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchSpecialists(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 pb-24 md:pb-0">
      <Header />

      {/* Search Section */}
      <section className="bg-white border-b border-gray-200 px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-semibold mb-4">
            Пошук спеціалістів
          </h1>
          <SpecialistSearchForm onSearch={handleSearch} />
        </div>
      </section>

      {/* Results Section */}
      <section className="flex-1 px-4 py-8 max-w-7xl mx-auto w-full">
        {/* Results header */}
        <div className="mb-6">
          {!loading && (
            <p className="text-sm text-gray-600">
              Знайдено <span className="font-semibold text-gray-900">{total}</span> спеціалістів
            </p>
          )}
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
            <p className="text-gray-600">Завантаження...</p>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-800 font-medium mb-2">Помилка</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && specialists.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Нічого не знайдено
            </h3>
            <p className="text-gray-600 mb-6">
              Спробуйте змінити параметри пошуку або скинути фільтри
            </p>
          </div>
        )}

        {/* Results grid */}
        {!loading && !error && specialists.length > 0 && (
          <>
            <div className="grid gap-4 md:gap-5">
              {specialists.map(specialist => (
                <SpecialistCard key={specialist.id} specialist={specialist} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Назад
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                          currentPage === pageNum
                            ? 'bg-indigo-600 text-white'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Вперед
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </section>

      <Footer />
      <BottomNavigation />
    </div>
  );
};

export default SearchResultsPage;
