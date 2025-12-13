'use client';

import PageBreadCrumb from '../components/common/PageBreadCrumb';
import UserMetaCard from '../components/UserProfile/UserMetaCard';
import UserInfoCard from '../components/UserProfile/UserInfoCard';
import UserAddressCard from '../components/UserProfile/UserAddressCard';

export default function ProfilePage() {
  return (
    <>
      <PageBreadCrumb pageTitle="Profile" />
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-800 lg:p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
          Profile
        </h3>
        <div className="space-y-6">
          <UserMetaCard />
          <UserInfoCard />
          <UserAddressCard />
        </div>
      </div>
    </>
  );
}
