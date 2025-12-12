import { useQuery } from "@tanstack/react-query";

interface StorageStatus {
  available: boolean;
  message: string;
}

export function useStorageStatus() {
  const { data, isLoading } = useQuery<StorageStatus>({
    queryKey: ['/api/storage/status'],
    staleTime: 1000 * 60 * 5,
  });

  return {
    isStorageAvailable: isLoading ? true : (data?.available ?? false),
    isLoading,
    message: data?.message ?? '',
  };
}
