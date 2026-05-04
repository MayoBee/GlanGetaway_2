import { useNavigate } from "react-router-dom";
import useSearchContext from "../hooks/useSearchContext";
import MobileNav from "./MobileNav";
import MainNav from "./MainNav";
import { Building2 } from "lucide-react";

const Header = () => {
  const search = useSearchContext();
  const navigate = useNavigate();

  const handleLogoClick = () => {
    search.clearSearchValues();
    navigate("/");
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50 h-[72px] flex items-center shrink-0">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex justify-between items-center h-full">
          <button
            onClick={handleLogoClick}
            className="flex items-center space-x-2 group"
          >
            {/* replace the icon/text with the custom logo image */}
            <img
           src="/glan-getaway-logo.png"
          alt="Glan Getaway"
          className="max-w-[180px] h-auto object-contain"
            />
          </button>
          <div className="md:hidden">
            <MobileNav />
          </div>
          <div className="hidden md:flex items-center">
            <MainNav />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
