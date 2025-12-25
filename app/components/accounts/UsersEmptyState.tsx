import Link from "next/link";
import { PlusIcon, UserIcon } from "@/app/icons";
import Button from "@/app/components/ui/button/Button";

interface UsersEmptyStateProps {
  isDesktop?: boolean;
}

export default function UsersEmptyState({ isDesktop = true }: UsersEmptyStateProps) {
  return (
    <div className={`text-center py-12 ${isDesktop ? 'hidden lg:block' : ''}`}>
      <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No users found</h3>
      <p className="text-gray-600 dark:text-gray-400 mb-4">Get started by creating your first user.</p>
      <Link href="/accounts/users/create">
        <Button>
          <PlusIcon className="w-4 h-4 mr-2" />
          Create User
        </Button>
      </Link>
    </div>
  );
}
