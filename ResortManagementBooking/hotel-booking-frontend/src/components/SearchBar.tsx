import { FormEvent, useState, useEffect } from "react";
import useSearchContext from "../hooks/useSearchContext";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent } from "./ui/card";
import { SlidersHorizontal, X, ChevronDown, ChevronUp } from "lucide-react";

const SearchBar = () => {
  const navigate = useNavigate();
  const search = useSearchContext();

  const [destination, setDestination] = useState<string>(search.destination);
  const [checkIn, setCheckIn] = useState<Date>(search.checkIn);
  const [checkOut, setCheckOut] = useState<Date>(search.checkOut);
  const [checkInTime, setCheckInTime] = useState<string>(search.checkInTime);
  const [checkOutTime, setCheckOutTime] = useState<string>(search.checkOutTime);
  const [adultCount, setAdultCount] = useState<number>(search.adultCount);
  const [childCount, setChildCount] = useState<number>(search.childCount);
  const [childAges, setChildAges] = useState<number[]>(() => []);
  const [showFilters, setShowFilters] = useState<boolean>(false);

  const minDate = new Date();
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + 1);

  useEffect(() => {
    if (childCount > childAges.length) {
      setChildAges((prev) => [
        ...prev,
        ...Array(childCount - prev.length).fill(1),
      ]);
    } else if (childCount < childAges.length) {
      setChildAges((prev) => prev.slice(0, childCount));
    }
  }, [childCount, childAges.length]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    search.saveSearchValues(
      destination.trim(),
      checkIn,
      checkOut,
      adultCount,
      childCount,
      childAges,
      checkInTime,
      checkOutTime
    );

    navigate("/search");

    setTimeout(() => {
      setDestination("");
      setCheckIn(minDate);
      setCheckOut(minDate);
      setCheckInTime("12:00");
      setCheckOutTime("11:00");
      setAdultCount(1);
      setChildCount(0);
      setChildAges([]);
      setShowFilters(false);
    }, 100);
  };

  const handleClear = () => {
    setDestination("");
    setCheckIn(minDate);
    setCheckOut(minDate);
    setCheckInTime("12:00");
    setCheckOutTime("11:00");
    setAdultCount(1);
    setChildCount(0);
    setChildAges([]);
    setShowFilters(false);
    search.clearSearchValues();
  };

  // Check if any filters are active (non-default values)
  const hasActiveFilters =
    checkIn.toDateString() !== minDate.toDateString() ||
    checkOut.toDateString() !== minDate.toDateString() ||
    checkInTime !== "12:00" ||
    checkOutTime !== "11:00" ||
    adultCount !== 1 ||
    childCount !== 0;

  return (
    <Card className="p-4 w-full">
      <CardContent className="p-0">
        <form onSubmit={handleSubmit} autoComplete="off" className="space-y-3">
          {/* Main search row */}
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Input
                placeholder="Search beach resorts..."
                value={destination}
                onChange={(event) => setDestination(event.target.value)}
                className="w-full"
              />
            </div>

            {/* Filters toggle button */}
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md border text-sm font-medium transition-colors whitespace-nowrap ${
                showFilters || hasActiveFilters
                  ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                  : "bg-white text-gray-600 border-gray-300 hover:bg-gray-100"
              }`}
              title="Toggle filters"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
              {hasActiveFilters && !showFilters && (
                <span className="bg-orange-400 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                  !
                </span>
              )}
              {showFilters ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>

            <Button
              type="submit"
              className="whitespace-nowrap bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-md font-semibold"
            >
              Search
            </Button>
          </div>

          {/* Expandable filters panel */}
          {showFilters && (
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-4">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-semibold text-gray-700">
                  Search Filters
                </h3>
                <button
                  type="button"
                  onClick={() => setShowFilters(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Dates row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Check-in
                  </label>
                  <DatePicker
                    selected={checkIn}
                    onChange={(date) => setCheckIn(date as Date)}
                    selectsStart
                    startDate={checkIn}
                    endDate={checkOut}
                    minDate={minDate}
                    maxDate={maxDate}
                    placeholderText="Check-in Date"
                    className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    wrapperClassName="min-w-full"
                  />
                  <input
                    type="time"
                    value={checkInTime}
                    onChange={(e) => setCheckInTime(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Check-out
                  </label>
                  <DatePicker
                    selected={checkOut}
                    onChange={(date) => setCheckOut(date as Date)}
                    selectsEnd
                    startDate={checkIn}
                    endDate={checkOut}
                    minDate={checkIn || minDate}
                    maxDate={maxDate}
                    placeholderText="Check-out Date"
                    className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    wrapperClassName="min-w-full"
                  />
                  <input
                    type="time"
                    value={checkOutTime}
                    onChange={(e) => setCheckOutTime(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              </div>

              {/* Guests row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Adults
                  </label>
                  <div className="flex items-center border border-gray-300 rounded-md overflow-hidden bg-white w-full">
                    <button
                      type="button"
                      onClick={() =>
                        setAdultCount(Math.max(1, adultCount - 1))
                      }
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-lg leading-none"
                    >
                      −
                    </button>
                    <span className="flex-1 text-center text-sm font-semibold">
                      {adultCount}
                    </span>
                    <button
                      type="button"
                      onClick={() => setAdultCount(adultCount + 1)}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-lg leading-none"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Children
                  </label>
                  <div className="flex items-center border border-gray-300 rounded-md overflow-hidden bg-white w-full">
                    <button
                      type="button"
                      onClick={() =>
                        setChildCount(Math.max(0, childCount - 1))
                      }
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-lg leading-none"
                    >
                      −
                    </button>
                    <span className="flex-1 text-center text-sm font-semibold">
                      {childCount}
                    </span>
                    <button
                      type="button"
                      onClick={() => setChildCount(childCount + 1)}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-lg leading-none"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Child age selectors */}
              {childCount > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {childAges.map((age, idx) => (
                    <div key={idx} className="space-y-1">
                      <label className="text-xs text-gray-500">
                        Child {idx + 1} age
                      </label>
                      <select
                        value={age}
                        onChange={(e) => {
                          const newAges = [...childAges];
                          newAges[idx] = parseInt(e.target.value);
                          setChildAges(newAges);
                        }}
                        className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {Array.from({ length: 17 }, (_, i) => i + 1).map(
                          (n) => (
                            <option key={n} value={n}>
                              {n} yr{n > 1 ? "s" : ""}
                            </option>
                          )
                        )}
                      </select>
                    </div>
                  ))}
                </div>
              )}

              {/* Filter actions */}
              <div className="flex justify-end gap-2 pt-1 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium"
                >
                  Clear all
                </button>
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 text-sm rounded-md font-semibold"
                >
                  Search Resorts
                </Button>
              </div>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
};

export default SearchBar;
