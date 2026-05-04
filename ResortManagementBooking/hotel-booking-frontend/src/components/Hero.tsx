import { Search, MapPin, Calendar, Users, Star } from "lucide-react";
import SearchBar from "./SearchBar";

const Hero = () => {
  return (
    <section
      className="relative overflow-hidden"
      style={{
        backgroundImage: "url('/beach-hero.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-blue-900/60" />
      <div className="w-full px-4 sm:px-6 lg:px-8 pt-8 pb-8 relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Skip the stress 
            <span className="block bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
             Book the rest
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-white/90 mb-12 leading-relaxed">
            Discover amazing beach resorts and accommodations worldwide.
            <br className="hidden md:block" />
            Book your next seaside getaway with ease.
          </p>

          {/* Feature Icons */}
          <div className="flex justify-center items-center space-x-8 mb-12">
            <div className="flex items-center text-white/80">
              <MapPin className="w-5 h-5 mr-2" />
              <span>Worldwide</span>
            </div>
            <div className="flex items-center text-white/80">
              <Calendar className="w-5 h-5 mr-2" />
              <span>Easy Booking</span>
            </div>
            <div className="flex items-center text-white/80">
              <Users className="w-5 h-5 mr-2" />
              <span>10,000+ Users</span>
            </div>
          </div>

          {/* Search Bar */}
          <div className="max-w-4xl mx-auto">
            <SearchBar />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
