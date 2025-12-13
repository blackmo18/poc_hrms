import { Modal } from "../../ui/modal";
import Button from "../../ui/button/Button";
import SocialLinksForm from "./SocialLinksForm";
import PersonalInfoForm from "./PersonalInfoForm";

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  bio: string;
  facebook: string;
  twitter: string;
  linkedin: string;
  instagram: string;
}

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: FormData;
  onFormDataChange: (data: FormData) => void;
  onSave: () => void;
}

export default function EditProfileModal({
  isOpen,
  onClose,
  formData,
  onFormDataChange,
  onSave,
}: EditProfileModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[700px] m-4">
      <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
        <div className="px-2 pr-14">
          <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
            Edit Personal Information
          </h4>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
            Update your details to keep your profile up-to-date.
          </p>
        </div>
        <form className="flex flex-col">
          <div className="custom-scrollbar h-[450px] overflow-y-auto px-2 pb-3">
            <SocialLinksForm
              facebook={formData.facebook}
              twitter={formData.twitter}
              linkedin={formData.linkedin}
              instagram={formData.instagram}
              onFacebookChange={(value) =>
                onFormDataChange({ ...formData, facebook: value })
              }
              onTwitterChange={(value) =>
                onFormDataChange({ ...formData, twitter: value })
              }
              onLinkedinChange={(value) =>
                onFormDataChange({ ...formData, linkedin: value })
              }
              onInstagramChange={(value) =>
                onFormDataChange({ ...formData, instagram: value })
              }
            />
            <div className="mt-7">
              <PersonalInfoForm
                firstName={formData.firstName}
                lastName={formData.lastName}
                email={formData.email}
                phone={formData.phone}
                bio={formData.bio}
                onFirstNameChange={(value) =>
                  onFormDataChange({ ...formData, firstName: value })
                }
                onLastNameChange={(value) =>
                  onFormDataChange({ ...formData, lastName: value })
                }
                onEmailChange={(value) =>
                  onFormDataChange({ ...formData, email: value })
                }
                onPhoneChange={(value) =>
                  onFormDataChange({ ...formData, phone: value })
                }
                onBioChange={(value) =>
                  onFormDataChange({ ...formData, bio: value })
                }
              />
            </div>
          </div>
          <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
            <Button size="sm" variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button size="sm" onClick={onSave}>
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
