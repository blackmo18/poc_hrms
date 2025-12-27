import Input from "../../form/input/InputField";
import Label from "../../form/Label";

interface PersonalInfoFormProps {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  bio?: string;
  onFirstNameChange?: (value: string) => void;
  onLastNameChange?: (value: string) => void;
  onEmailChange?: (value: string) => void;
  onPhoneChange?: (value: string) => void;
  onBioChange?: (value: string) => void;
}

export default function PersonalInfoForm({
  firstName = "Musharof",
  lastName = "Chowdhury",
  email = "randomuser@pimjo.com",
  phone = "+09 363 398 46",
  bio = "Team Manager",
  onFirstNameChange,
  onLastNameChange,
  onEmailChange,
  onPhoneChange,
  onBioChange,
}: PersonalInfoFormProps) {
  return (
    <div>
      <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
        Personal Information
      </h5>

      <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
        <div className="col-span-2 lg:col-span-1">
          <Label>First Name</Label>
          <Input
            type="text"
            value={firstName}
            onChange={(e) => onFirstNameChange?.(e.target.value)}
          />
        </div>

        <div className="col-span-2 lg:col-span-1">
          <Label>Last Name</Label>
          <Input
            type="text"
            value={lastName}
            onChange={(e) => onLastNameChange?.(e.target.value)}
          />
        </div>

        <div className="col-span-2 lg:col-span-1">
          <Label>Email Address</Label>
          <Input
            type="text"
            value={email}
            onChange={(e) => onEmailChange?.(e.target.value)}
          />
        </div>

        <div className="col-span-2 lg:col-span-1">
          <Label>Phone</Label>
          <Input
            type="text"
            value={phone}
            onChange={(e) => onPhoneChange?.(e.target.value)}
          />
        </div>

        <div className="col-span-2">
          <Label>Bio</Label>
          <Input
            type="text"
            value={bio}
            onChange={(e) => onBioChange?.(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
