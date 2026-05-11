import { HotelType } from "../../../shared/types";

type Props = {
  checkIn: Date;
  checkOut: Date;
  adultCount: number;
  childCount: number;
  numberOfNights: number;
  hotel: HotelType;
  seniorCount?: number;
  pwdCount?: number;
};

const BookingDetailsSummary = ({
  checkIn,
  checkOut,
  adultCount,
  childCount,
  numberOfNights,
  hotel,
  seniorCount = 0,
  pwdCount = 0,
}: Props) => {
  return (
    <div className="grid gap-4 rounded-lg border border-slate-300 p-5 h-fit">
      <h2 className="text-xl font-bold">Your Booking Details</h2>
      <div className="border-b py-2">
        Resort Location:
        <div className="font-bold">{`${hotel.name}, ${hotel.city}, ${hotel.country}`}</div>
      </div>
      <div className="flex justify-between">
        <div>
          Check-in
          <div className="font-bold"> {checkIn.toDateString()}</div>
        </div>
        <div>
          Check-out
          <div className="font-bold"> {checkOut.toDateString()}</div>
        </div>
      </div>
      <div className="border-t border-b py-2">
        Total length of stay:
        <div className="font-bold">{numberOfNights} nights</div>
      </div>

      <div>
        Guests{" "}
        <div className="font-bold">
          {adultCount} adults & {childCount} children
        </div>
        {(seniorCount > 0 || pwdCount > 0) && (
          <div className="mt-2 pt-2 border-t border-dashed border-gray-300">
            <div className="text-sm font-medium text-green-700">
              ✓ Discount Eligible Guests:
            </div>
            {seniorCount > 0 && (
              <div className="text-sm text-amber-700">
                • {seniorCount} Senior Citizen{seniorCount > 1 ? 's' : ''} (20% off)
              </div>
            )}
            {pwdCount > 0 && (
              <div className="text-sm text-purple-700">
                • {pwdCount} PWD{pwdCount > 1 ? 's' : ''} (20% off)
              </div>
            )}
            <div className="text-xs text-gray-500 mt-1">
              Bring valid ID upon check-in
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingDetailsSummary;
