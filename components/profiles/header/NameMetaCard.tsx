import { useState } from "react";
import { useModal } from "../../../hooks/useModal";
import ProfileHeader from "./ProfileHeader";
import EditProfileModal from "./EditProfileModal";

export default function NameMetaCard() {
  const { isOpen, openModal, closeModal } = useModal();
  const [formData, setFormData] = useState({
    firstName: "Musharof",
    lastName: "Chowdhury",
    email: "randomuser@pimjo.com",
    phone: "+09 363 398 46",
    bio: "Team Manager",
    facebook: "https://www.facebook.com/PimjoHQ",
    twitter: "https://x.com/PimjoHQ",
    linkedin: "https://www.linkedin.com/company/pimjo",
    instagram: "https://instagram.com/PimjoHQ",
  });

  const handleSave = () => {
    // Handle save logic here
    closeModal();
  };

  return (
    <>
      <ProfileHeader
        name={`${formData.firstName} ${formData.lastName}`}
        title="Team Manager"
        email={formData.email}
        phone={formData.phone}
        avatarUrl="/images/user/owner.jpg"
        onEditClick={openModal}
      />

      <EditProfileModal
        isOpen={isOpen}
        onClose={closeModal}
        formData={formData}
        onFormDataChange={setFormData}
        onSave={handleSave}
      />
    </>
  );
}
