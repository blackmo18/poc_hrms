interface GeneralInfoCardProps {
  id: string
  name: string  
  address: string
  createdDate: Date
  updatedDate: Date
  status: string
}

export default function GeneralInfoCard({
  id,
  name,
  address,
  createdDate,
  updatedDate,
  status
}: GeneralInfoCardProps) {
  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div>
        <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
          General Information
        </h4>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
          <div>
            <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
              Organization ID
            </p>
            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
              {id}
            </p>
          </div>

          <div>
            <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
              Organization Name
            </p>
            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
              {name}
            </p>
          </div>

          <div>
            <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
              Address
            </p>
            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
              {address || 'Not provided'}
            </p>
          </div>

          <div>
            <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
              Status
            </p>
            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
              {status}
            </p>
          </div>

          <div>
            <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
              Created Date
            </p>
            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
              {new Date(createdDate).toLocaleDateString()}
            </p>
          </div>

          <div>
            <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
              Last Updated
            </p>
            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
              {new Date(updatedDate).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
