import Link from "next/link";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  pageTitle: string;
  breadcrumbs?: BreadcrumbItem[];
}

const PageBreadcrumb: React.FC<BreadcrumbProps> = ({ pageTitle, breadcrumbs }) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
      <h2
        className="text-xl font-semibold text-gray-800 dark:text-white/90"
        x-text="pageName"
      >
        {pageTitle}
      </h2>
      <nav>
        <ol className="flex items-center gap-1.5">
          {breadcrumbs ? (
            <>
              <li>
                <Link
                  className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400"
                  href="/"
                >
                  Home
                  <svg
                    className="stroke-current"
                    width="17"
                    height="16"
                    viewBox="0 0 17 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M6.0765 12.667L10.2432 8.50033L6.0765 4.33366"
                      stroke=""
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Link>
              </li>
              {breadcrumbs.map((breadcrumb, index) => (
                <li key={index}>
                  {breadcrumb.href ? (
                    <Link
                      className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400"
                      href={breadcrumb.href}
                    >
                      {breadcrumb.label}
                      {index < breadcrumbs.length - 1 && (
                        <svg
                          className="stroke-current"
                          width="17"
                          height="16"
                          viewBox="0 0 17 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M6.0765 12.667L10.2432 8.50033L6.0765 4.33366"
                            stroke=""
                            strokeWidth="1.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </Link>
                  ) : (
                    <span className="text-sm text-gray-800 dark:text-white/90">
                      {breadcrumb.label}
                    </span>
                  )}
                </li>
              ))}
            </>
          ) : (
            <>
              <li>
                <Link
                  className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400"
                  href="/"
                >
                  Home
                  <svg
                    className="stroke-current"
                    width="17"
                    height="16"
                    viewBox="0 0 17 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M6.0765 12.667L10.2432 8.50033L6.0765 4.33366"
                      stroke=""
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Link>
              </li>
              <li className="text-sm text-gray-800 dark:text-white/90">
                {pageTitle}
              </li>
            </>
          )}
        </ol>
      </nav>
    </div>
  );
};

export default PageBreadcrumb;
