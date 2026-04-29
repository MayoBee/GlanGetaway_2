import { Facebook, Instagram, Music, Share2 } from "lucide-react";

type Props = {
  resortName: string;
  resortDescription?: string;
  resortUrl: string;
};

const SocialShareButtons = ({ resortName, resortDescription, resortUrl }: Props) => {
  const shareText = `Check out ${resortName} - an amazing beach resort!`;
  const shareUrl = resortUrl || window.location.href;

  const handleShare = (platform: string) => {
    let url = "";
    
    switch (platform) {
      case "facebook":
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
        break;
      case "instagram":
        // Instagram doesn't support direct URL sharing, so we copy the text
        navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
        alert("Link copied to clipboard! You can now paste it in your Instagram story.");
        return;
      case "tiktok":
        url = `https://www.tiktok.com/share?url=${encodeURIComponent(shareUrl)}`;
        break;
      default:
        return;
    }
    
    if (url) {
      window.open(url, "_blank", "width=600,height=400");
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <h4 className="text-sm font-semibold text-gray-700 mb-2">Share this resort</h4>
      <div className="flex gap-2">
        <button
          onClick={() => handleShare("facebook")}
          className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm"
          title="Share on Facebook"
        >
          <Facebook className="w-4 h-4" />
          <span>Facebook</span>
        </button>
        
        <button
          onClick={() => handleShare("instagram")}
          className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-2 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 text-sm"
          title="Share on Instagram"
        >
          <Instagram className="w-4 h-4" />
          <span>Instagram</span>
        </button>
        
        <button
          onClick={() => handleShare("tiktok")}
          className="flex items-center gap-2 bg-black text-white px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors duration-200 text-sm"
          title="Share on TikTok"
        >
          <Music className="w-4 h-4" />
          <span>TikTok</span>
        </button>
        
        <button
          onClick={() => {
            navigator.clipboard.writeText(shareUrl);
            alert("Link copied to clipboard!");
          }}
          className="flex items-center gap-2 bg-gray-600 text-white px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors duration-200 text-sm"
          title="Copy link"
        >
          <Share2 className="w-4 h-4" />
          <span>Copy</span>
        </button>
      </div>
    </div>
  );
};

export default SocialShareButtons;
