import Input from "../../form/input/InputField";
import Label from "../../form/Label";

interface SocialLinksFormProps {
  facebook?: string;
  twitter?: string;
  linkedin?: string;
  instagram?: string;
  onFacebookChange?: (value: string) => void;
  onTwitterChange?: (value: string) => void;
  onLinkedinChange?: (value: string) => void;
  onInstagramChange?: (value: string) => void;
}

export default function SocialLinksForm({
  facebook = "https://www.facebook.com/PimjoHQ",
  twitter = "https://x.com/PimjoHQ",
  linkedin = "https://www.linkedin.com/company/pimjo",
  instagram = "https://instagram.com/PimjoHQ",
  onFacebookChange,
  onTwitterChange,
  onLinkedinChange,
  onInstagramChange,
}: SocialLinksFormProps) {
  return (
    <div>
      <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
        Social Links
      </h5>

      <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
        <div>
          <Label>Facebook</Label>
          <Input
            type="text"
            value={facebook}
            onChange={(e) => onFacebookChange?.(e.target.value)}
          />
        </div>

        <div>
          <Label>X.com</Label>
          <Input
            type="text"
            value={twitter}
            onChange={(e) => onTwitterChange?.(e.target.value)}
          />
        </div>

        <div>
          <Label>Linkedin</Label>
          <Input
            type="text"
            value={linkedin}
            onChange={(e) => onLinkedinChange?.(e.target.value)}
          />
        </div>

        <div>
          <Label>Instagram</Label>
          <Input
            type="text"
            value={instagram}
            onChange={(e) => onInstagramChange?.(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
