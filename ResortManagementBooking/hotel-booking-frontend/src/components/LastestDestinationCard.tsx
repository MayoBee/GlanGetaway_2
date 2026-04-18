import { Link } from "react-router-dom";
import { HotelType } from "../../../shared/types";
import { MapPin, Star } from "lucide-react";
import { Badge } from "./ui/badge";
import SmartImage from "./SmartImage";

type Props = {
  hotel: HotelType;
};

const LatestDestinationCard = ({ hotel }: Props) => {
  return (
    <Link
      to={`/detail/${hotel._id}`}
      className="group relative cursor-pointer overflow-hidden rounded-2xl shadow-soft transition-all duration-300 hover:shadow-large hover:scale-105 bg-white flex flex-col w-full h-[350px] border border-gray-10"
      style={{ minWidth: 320, maxWidth: 500 }}
    >
      <div className="w-full h-full relative">
        <SmartImage
          src={hotel.imageUrls}
          alt={`${hotel.name} - Hotel preview`}
          className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-110"
          fallbackText={hotel.name}
          showLoading={true}
        />

        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        {/* Hotel Stats Badge */}
        <div className="absolute top-4 right-4">
          <div className="bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center space-x-1">
            <Star className="w-4 h-4 text-yellow-500 fill-current" />
            <span className="text-sm font-semibold text-gray-800">
              {hotel.starRating}
            </span>
          </div>
        </div>

        {/* Price Badge */}
        <div className="absolute top-4 left-4">
          <div className="bg-primary-600 text-white rounded-full px-3 py-1">
            <span className="text-sm font-bold">
              {(hotel.hasDayRate && hotel.hasNightRate) ? `₱${hotel.dayRate || 0}/₱${hotel.nightRate || 0}` :
               hotel.hasDayRate ? `₱${hotel.dayRate || 0}` :
               hotel.hasNightRate ? `₱${hotel.nightRate || 0}` :
               `₱0`}
            </span>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 p-6 w-full">
        <div className="space-y-2">
          <h3 className="text-white font-bold text-2xl tracking-tight group-hover:text-primary-200 transition-colors">
            {hotel.name}
          </h3>

          <div className="flex items-center space-x-4 text-white/90">
            <div className="flex items-center space-x-1">
              <MapPin className="w-4 h-4" />
              <span className="text-sm font-medium">
                {hotel.city}, {hotel.country}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex flex-col space-y-2">
              {/* Resort Types */}
              <div className="flex flex-wrap gap-1">
                {(() => {
                  let types = [];
                  if (Array.isArray(hotel.type)) {
                    types = hotel.type;
                  } else if (typeof hotel.type === 'string') {
                    try {
                      // Try to parse as JSON string
                      const parsed = JSON.parse(hotel.type);
                      types = Array.isArray(parsed) ? parsed : [hotel.type];
                    } catch {
                      // If parsing fails, treat as single type
                      types = [hotel.type];
                    }
                  }
                  
                  return types.slice(0, 3).map((type) => (
                    <Badge
                      key={type}
                      variant="outline"
                      className="text-xs px-2 py-1 bg-white/20 backdrop-blur-sm border-white/30 text-white"
                    >
                      {type}
                    </Badge>
                  ));
                })()}
              </div>
            </div>

            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1 hover:bg-white/30 transition-colors">
              <span className="text-sm font-semibold text-white">
                View Details
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default LatestDestinationCard;
