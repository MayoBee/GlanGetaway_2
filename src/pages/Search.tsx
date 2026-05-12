import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import useSearchContext from "../hooks/useSearchContext";
import { useQuery } from "react-query";
import { searchHotels } from "../api-client";
import { HotelType } from "@shared/types";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import SearchResultCard from "../components/SearchResultsCard";
import {
  Search as SearchIcon,
  Filter,
  ChevronDown,
  X,
} from "lucide-react";
import SearchBar from "../components/SearchBar";
import StarRatingFilter from "../components/StarRatingFilter";
import HotelTypesFilter from "../components/HotelTypesFilter";
import FacilitiesFilter from "../components/FacilitiesFilter";
import PriceFilter from "../components/PriceFilter";
import SearchResultCardSkeleton from "../components/SearchResultCardSkeleton";

const Search = () => {
  const [urlSearchParams] = useSearchParams();
  const search = useSearchContext();
  const [page, setPage] = useState<number>(1);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [stars, setStars] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [facilities, setFacilities] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState<number>(0);
  const [sortOption, setSortOption] = useState<string>("");

  // Sync URL params to search context when navigating with query string (e.g. Hotels nav link)
  useEffect(() => {
    const destination = urlSearchParams.get("destination");
    const checkIn = urlSearchParams.get("checkIn");
    const checkOut = urlSearchParams.get("checkOut");
    const adultCount = urlSearchParams.get("adultCount");
    const childCount = urlSearchParams.get("childCount");
    if (checkIn && checkOut) {
      search.saveSearchValues(
        destination || "",
        new Date(checkIn),
        new Date(checkOut),
        parseInt(adultCount || "1", 10),
        parseInt(childCount || "1", 10)
      );
    }
  }, [urlSearchParams.toString()]);

  const searchParams = {
    destination: search.destination?.trim() || "",
    checkIn: search.checkIn.toISOString(),
    checkOut: search.checkOut.toISOString(),
    adultCount: search.adultCount.toString(),
    childCount: search.childCount.toString(),
    page: page.toString(),
    stars: stars,
    types: types,
    facilities: facilities,
    maxPrice: maxPrice.toString(),
    sortOption,
  };

  const { data: hotelData, isLoading } = useQuery(
    ["searchHotels", searchParams],
    () => searchHotels(searchParams)
  );

  const handleStarsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const starRating = event.target.value;

    setStars((prevStars) =>
      event.target.checked
        ? [...prevStars, starRating]
        : prevStars.filter((star) => star !== starRating)
    );
  };

  const handleHotelTypeChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const hotelType = event.target.value;

    setTypes((prevHotelTypes) =>
      event.target.checked
        ? [...prevHotelTypes, hotelType]
        : prevHotelTypes.filter((hotel) => hotel !== hotelType)
    );
  };

  const handleFacilityChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const facility = event.target.value;

    setFacilities((prevFacilities) =>
      event.target.checked
        ? [...prevFacilities, facility]
        : prevFacilities.filter((prevFacility) => prevFacility !== facility)
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Filter Bar - Fixed Bottom */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
        <div className="p-4">
          <Button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="w-full flex items-center justify-between h-12 min-h-[44px]"
            variant="outline"
            size="lg"
          >
            <span className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              <span className="font-medium">Filters</span>
              {(stars.length > 0 || types.length > 0 || facilities.length > 0 || maxPrice > 0) && (
                <Badge variant="secondary" className="ml-1">
                  {stars.length + types.length + facilities.length + (maxPrice > 0 ? 1 : 0)}
                </Badge>
              )}
            </span>
            <ChevronDown
              className={`w-5 h-5 transition-transform ${
                showMobileFilters ? "rotate-180" : ""
              }`}
            />
          </Button>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {showMobileFilters && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setShowMobileFilters(false)}
          />
          {/* Filter Panel */}
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[70vh] overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Filters</h3>
                <Button
                  onClick={() => setShowMobileFilters(false)}
                  variant="ghost"
                  size="sm"
                  className="min-h-[44px] min-w-[44px]"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <div className="space-y-4">
                <StarRatingFilter
                  selectedStars={stars}
                  onChange={handleStarsChange}
                />
                <HotelTypesFilter
                  selectedHotelTypes={types}
                  onChange={handleHotelTypeChange}
                />
                <FacilitiesFilter
                  selectedFacilities={facilities}
                  onChange={handleFacilityChange}
                />
                <PriceFilter
                  selectedPrice={maxPrice || undefined}
                  onChange={(value) => setMaxPrice(value || 0)}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 pb-20 md:pb-0">
        {/* Filters Sidebar - Desktop Only */}
        <div className="hidden lg:block">
          <div className="sticky top-4 space-y-6">
            <div className="space-y-4">
              <StarRatingFilter
                selectedStars={stars}
                onChange={handleStarsChange}
              />
              <HotelTypesFilter
                selectedHotelTypes={types}
                onChange={handleHotelTypeChange}
              />
              <FacilitiesFilter
                selectedFacilities={facilities}
                onChange={handleFacilityChange}
              />
              <PriceFilter
                selectedPrice={maxPrice || undefined}
                onChange={(value) => setMaxPrice(value || 0)}
              />
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Modify Your Search
          </h2>
          <SearchBar />
        </div>

        {/* Search Results */}
        <div className="px-4 sm:px-0">
          {isLoading ? (
            <div className="space-y-4 sm:space-y-6">
              {/* Loading skeleton cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {[...Array(6)].map((_, index) => (
                  <SearchResultCardSkeleton key={index} />
                ))}
              </div>
            </div>
          ) : hotelData?.data?.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="max-w-md mx-auto">
                <div className="mb-6">
                  <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                    <SearchIcon className="w-12 h-12 text-gray-400" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No Results Found
                </h3>
                <p className="text-gray-600 mb-6">
                  We couldn't find any resorts matching your criteria. Try adjusting your filters or search parameters.
                </p>
                <div className="space-y-3">
                  <Button
                    onClick={() => {
                      setStars([]);
                      setTypes([]);
                      setFacilities([]);
                      setMaxPrice(0);
                    }}
                    variant="outline"
                    className="w-full sm:w-auto min-h-[44px]"
                  >
                    Clear All Filters
                  </Button>
                  <Button
                    onClick={() => window.location.reload()}
                    className="w-full sm:w-auto min-h-[44px]"
                  >
                    Refresh Search
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Results Count */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  {hotelData?.data?.length} resorts found
                </p>
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                >
                  <option value="">Sort by</option>
                  <option value="pricePerNightAsc">Price: Low to High</option>
                  <option value="pricePerNightDesc">Price: High to Low</option>
                  <option value="starRatingAsc">Star Rating: Low to High</option>
                  <option value="starRatingDesc">Star Rating: High to Low</option>
                </select>
              </div>

              {/* Hotel Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {hotelData?.data?.map((hotel: HotelType) => (
                  <SearchResultCard hotel={hotel} key={hotel._id} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Search;

