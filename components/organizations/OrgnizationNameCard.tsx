import ProfileHeader from "../profiles/header/ProfileHeader";

interface OrganizationNameCardProps {
  name: string;
  email: string;
  phone: string;
  description: string;
  website: string;
  socialMedias: {
    provider: string;
    link: string;
  }[];
  editClick?: () => void;
}

export default function OrganizationNameCard({ name, email, phone, description, website, socialMedias, editClick }: OrganizationNameCardProps) {
  // Convert socialMedias to the format expected by ProfileHeader
  const socialLinks = socialMedias?.map(social => ({
    href: social.link,
    icon: <span>{social.provider[0].toUpperCase()}</span>, // Simple icon placeholder
    label: social.provider
  }));

  return (
    <ProfileHeader
      name={name}
      title={description || "Organization"}
      email={email || "No email provided"}
      phone={phone || "No phone provided"}
      avatarUrl="/images/organization/default.jpg"
      socialLinks={socialLinks}
      onEditClick={editClick}
    />
  );
}
