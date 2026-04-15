import { AuthGuard } from '../components/AuthGuard';
import { SubscribeForm } from '../components/SubscribeForm';
import { useDeepLinkParams } from '../hooks/useDeepLinkParams';

export function Subscribe() {
  const defaults = useDeepLinkParams();

  return (
    <AuthGuard>
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold text-emerald-400 mb-2">Create Subscription</h2>
        <p className="text-slate-400 mb-8">
          Set up a recurring payment to any service on the Internet Computer.
          {defaults.service && (
            <span className="block text-sm text-slate-500 mt-1">
              Pre-filled from service deep link.
            </span>
          )}
        </p>
        <SubscribeForm defaults={defaults} />
      </div>
    </AuthGuard>
  );
}
