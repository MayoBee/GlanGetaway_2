import React, { useState, useEffect } from "react";

export type SearchContext = {
  destination: string;
  checkIn: Date;
  checkOut: Date;
  checkInTime: string;
  checkOutTime: string;
  checkInPeriod: string;
  checkOutPeriod: string;
  adultCount: number;
  childCount: number;
  childAges: number[]; // ages for each child (1-17)
  seniorCount: number; // Number of senior citizens
  pwdCount: number; // Number of PWD guests
  hotelId: string;
  saveSearchValues: (
    destination: string,
    checkIn: Date,
    checkOut: Date,
    adultCount: number,
    childCount: number,
    childAges?: number[],
    checkInTime?: string,
    checkOutTime?: string,
    checkInPeriod?: string,
    checkOutPeriod?: string,
    seniorCount?: number,
    pwdCount?: number
  ) => void;
  clearSearchValues: () => void;
};

export const SearchContext = React.createContext<SearchContext | undefined>(
  undefined
);

type SearchContextProviderProps = {
  children: React.ReactNode;
};

export const SearchContextProvider = ({
  children,
}: SearchContextProviderProps) => {
  // Initialize with default values to avoid SSR/hydration mismatch
  const [destination, setDestination] = useState<string>("");
  const [checkIn, setCheckIn] = useState<Date>(new Date());
  const [checkOut, setCheckOut] = useState<Date>(new Date());
  const [adultCount, setAdultCount] = useState<number>(1);
  const [childCount, setChildCount] = useState<number>(0);
  const [childAges, setChildAges] = useState<number[]>([]);
  const [hotelId, setHotelId] = useState<string>("");
  const [checkInTime, setCheckInTime] = useState<string>("12:00");
  const [checkOutTime, setCheckOutTime] = useState<string>("11:00");
  const [checkInPeriod, setCheckInPeriod] = useState<string>("PM");
  const [checkOutPeriod, setCheckOutPeriod] = useState<string>("AM");
  const [seniorCount, setSeniorCount] = useState<number>(0);
  const [pwdCount, setPwdCount] = useState<number>(0);
  
  // Load from sessionStorage after mount to avoid SSR/hydration mismatch
  useEffect(() => {
    setDestination(sessionStorage.getItem("destination") || "");
    setCheckIn(
      new Date(sessionStorage.getItem("checkIn") || new Date().toISOString())
    );
    setCheckOut(
      new Date(sessionStorage.getItem("checkOut") || new Date().toISOString())
    );
    setAdultCount(parseInt(sessionStorage.getItem("adultCount") || "1"));
    setChildCount(parseInt(sessionStorage.getItem("childCount") || "0"));
    const ages = sessionStorage.getItem("childAges");
    setChildAges(ages ? JSON.parse(ages) : []);
    setHotelId(sessionStorage.getItem("hotelID") || "");
    setCheckInTime(sessionStorage.getItem("checkInTime") || "12:00");
    setCheckOutTime(sessionStorage.getItem("checkOutTime") || "11:00");
    setCheckInPeriod(sessionStorage.getItem("checkInPeriod") || "PM");
    setCheckOutPeriod(sessionStorage.getItem("checkOutPeriod") || "AM");
  }, []);

  const saveSearchValues = (
    destination: string,
    checkIn: Date,
    checkOut: Date,
    adultCount: number,
    childCount: number,
    childAges: number[] = [],
    checkInTime: string = "12:00",
    checkOutTime: string = "11:00",
    checkInPeriod: string = "PM",
    checkOutPeriod: string = "AM",
    seniorCount: number = 0,
    pwdCount: number = 0,
    hotelId?: string
  ) => {
    setDestination(destination);
    setCheckIn(checkIn);
    setCheckOut(checkOut);
    setAdultCount(adultCount);
    setChildCount(childCount);
    setChildAges(childAges);
    setCheckInTime(checkInTime);
    setCheckOutTime(checkOutTime);
    setCheckInPeriod(checkInPeriod);
    setCheckOutPeriod(checkOutPeriod);
    setSeniorCount(seniorCount);
    setPwdCount(pwdCount);
    if (hotelId) {
      setHotelId(hotelId);
    }

    sessionStorage.setItem("destination", destination);
    sessionStorage.setItem("checkIn", checkIn.toISOString());
    sessionStorage.setItem("checkOut", checkOut.toISOString());
    sessionStorage.setItem("adultCount", adultCount.toString());
    sessionStorage.setItem("childCount", childCount.toString());
    sessionStorage.setItem("childAges", JSON.stringify(childAges));
    sessionStorage.setItem("checkInTime", checkInTime);
    sessionStorage.setItem("checkOutTime", checkOutTime);
    sessionStorage.setItem("checkInPeriod", checkInPeriod);
    sessionStorage.setItem("checkOutPeriod", checkOutPeriod);
    sessionStorage.setItem("seniorCount", seniorCount.toString());
    sessionStorage.setItem("pwdCount", pwdCount.toString());

    if (hotelId) {
      sessionStorage.setItem("hotelId", hotelId);
    }
  };

  const clearSearchValues = () => {
    setDestination("");
    setCheckIn(new Date());
    setCheckOut(new Date());
    setAdultCount(1);
    setChildCount(0);
    setSeniorCount(0);
    setPwdCount(0);
    setHotelId("");
    setCheckInTime("12:00");
    setCheckOutTime("11:00");
    setCheckInPeriod("PM");
    setCheckOutPeriod("AM");

    sessionStorage.removeItem("destination");
    sessionStorage.removeItem("checkIn");
    sessionStorage.removeItem("checkOut");
    sessionStorage.removeItem("adultCount");
    sessionStorage.removeItem("childCount");
    sessionStorage.removeItem("seniorCount");
    sessionStorage.removeItem("pwdCount");
    sessionStorage.removeItem("hotelId");
    sessionStorage.removeItem("checkInTime");
    sessionStorage.removeItem("checkOutTime");
    sessionStorage.removeItem("checkInPeriod");
    sessionStorage.removeItem("checkOutPeriod");

    // Clear cached places data if it's older than 5 minutes
    const cacheTime = localStorage.getItem("hotelPlacesTime");
    if (cacheTime) {
      const now = Date.now();
      if (now - parseInt(cacheTime) > 5 * 60 * 1000) {
        localStorage.removeItem("hotelPlaces");
        localStorage.removeItem("hotelPlacesTime");
      }
    }
  };

  return (
    <SearchContext.Provider
      value={{
        destination,
        checkIn,
        checkOut,
        checkInTime,
        checkOutTime,
        checkInPeriod,
        checkOutPeriod,
        adultCount,
        childCount,
        childAges,
        seniorCount,
        pwdCount,
        hotelId,
        saveSearchValues,
        clearSearchValues,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
};

// ...existing code...
