import { useQuery } from "react-query";
import { axiosInstance } from "../api-client";
import { fetchHotels } from "../api-client";
import LatestDestinationCard from "../components/LastestDestinationCard";
// import AdvancedSearch from "../components/AdvancedSearch";
import Hero from "../components/Hero";

const Home = () => {
  const { data: hotels, isLoading, error } = useQuery(
    "fetchQuery", 
    fetchHotels,
    {
      retry: (failureCount, error: any) => {
        // Don't retry on network errors or connection refused
        if (error.code === 'NETWORK_ERROR' || error.message?.includes('ERR_CONNECTION_REFUSED')) {
          return false;
        }
        // Retry up to 2 times for other errors
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Remove debug logs in production
  if (process.env.NODE_ENV === 'development') {
    console.log("Home component - Hotels data:", hotels);
    console.log("Home component - Loading:", isLoading);
    console.log("Home component - Error:", error);
  }

  return (
    <>
      <Hero />
      <div className="space-y-8">
        {/* Latest Destinations Section */}
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Latest Resorts
            </h2>
            <p className="text-gray-600">
              Most recent beach resorts added by our hosts
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {isLoading && (
              <div className="col-span-full text-center py-8">
                <p>Loading resorts...</p>
              </div>
            )}
            {error && (
              <div className="col-span-full text-center py-8">
                <p className="text-red-500">
                  {error.message?.includes('ERR_CONNECTION_REFUSED') || error.code === 'NETWORK_ERROR'
                    ? "Unable to connect to the server. Please check your internet connection or try again later."
                    : `Error loading resorts: ${error.message}`}
                </p>
              </div>
            )}
            {!isLoading && !error && hotels?.length === 0 && (
              <div className="col-span-full text-center py-8">
                <p>No resorts found.</p>
              </div>
            )}
            {hotels?.map((hotel) => (
              <LatestDestinationCard key={hotel._id} hotel={hotel} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;

