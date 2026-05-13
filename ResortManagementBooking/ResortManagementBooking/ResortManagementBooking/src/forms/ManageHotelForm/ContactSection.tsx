import { useFormContext } from "react-hook-form";
import { HotelFormData } from "./ManageHotelForm";
import { Facebook, Instagram, Music } from "lucide-react";

const ContactSection = () => {
  const { register } = useFormContext<HotelFormData>();

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-2xl font-bold">Contact Information</h2>
      
      {/* Basic Contact Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <label className="text-gray-700 text-sm font-bold flex-1">
          Phone
          <input
            type="text"
            className="border rounded w-full py-2 px-3 font-normal"
            {...register("contact.phone")}
          />
        </label>
        <label className="text-gray-700 text-sm font-bold flex-1">
          Email
          <input
            type="email"
            className="border rounded w-full py-2 px-3 font-normal"
            {...register("contact.email")}
          />
        </label>
        <label className="text-gray-700 text-sm font-bold flex-1">
          Website
          <input
            type="url"
            className="border rounded w-full py-2 px-3 font-normal"
            {...register("contact.website")}
          />
        </label>
      </div>

      {/* Social Media Links */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Social Media Links</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="text-gray-700 text-sm font-bold flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Facebook className="w-4 h-4 text-blue-600" />
              <span>Facebook</span>
            </div>
            <input
              type="url"
              placeholder="https://facebook.com/yourresort"
              className="border rounded w-full py-2 px-3 font-normal"
              {...register("contact.facebook")}
            />
          </label>
          <label className="text-gray-700 text-sm font-bold flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Instagram className="w-4 h-4 text-pink-600" />
              <span>Instagram</span>
            </div>
            <input
              type="url"
              placeholder="https://instagram.com/yourresort"
              className="border rounded w-full py-2 px-3 font-normal"
              {...register("contact.instagram")}
            />
          </label>
          <label className="text-gray-700 text-sm font-bold flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Music className="w-4 h-4 text-black" />
              <span>TikTok</span>
            </div>
            <input
              type="url"
              placeholder="https://tiktok.com/@yourresort"
              className="border rounded w-full py-2 px-3 font-normal"
              {...register("contact.tiktok")}
            />
          </label>
        </div>
      </div>
    </div>
  );
};

export default ContactSection;

