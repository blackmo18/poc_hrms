interface SocialLink {
  href: string;
  icon: React.ReactNode;
  label: string;
}

interface SocialMediaLinksProps {
  links: SocialLink[];
}

export default function SocialMediaLinks({ links }: SocialMediaLinksProps) {
  return (
    <div className="flex items-center gap-2">
      {links.map((link, index) => (
        <a
          key={index}
          href={link.href}
          target="_blank"
          rel="noopener"
          className="flex h-11 w-11 items-center justify-center gap-2 rounded-full border border-gray-300 bg-white text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
          title={link.label}
        >
          {link.icon}
        </a>
      ))}
    </div>
  );
}
