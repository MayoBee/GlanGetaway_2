import { useContext } from "react";
import { AppContext, type AppContext as AppContextType } from "../contexts/AppContext";

const useAppContext = () => {
  const context = useContext(AppContext);
  return context as AppContextType;
};

export default useAppContext;
