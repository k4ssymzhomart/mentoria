import { RouteStatus } from '@/components/route-state';

export default function RootNotFound() {
  return (
    <RouteStatus
      title="This page is not available"
      description="It may have moved, been unpublished, or the link may be incomplete."
      actionLabel="Back home"
    />
  );
}
