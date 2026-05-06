import { CONFIG } from '../config';
import { DeepLinkBuilder } from '../components/DeepLinkBuilder';

export function About() {
  return (
    <div className="max-w-3xl">
      <h2 className="text-3xl font-bold text-emerald-400 mb-6">About ICRC-79</h2>

      <section className="mb-8">
        <h3 className="text-xl font-semibold text-slate-200 mb-3">What is ICRC-79?</h3>
        <p className="text-slate-400 leading-relaxed">
          ICRC-79 defines a standard for <strong className="text-slate-200">recurring subscription payments</strong> on
          the Internet Computer. It enables users to authorize periodic token transfers to services — similar to
          subscription billing in traditional payment systems, but fully on-chain with transparent and auditable
          transaction logs.
        </p>
      </section>

      <section className="mb-8">
        <h3 className="text-xl font-semibold text-slate-200 mb-3">How It Works</h3>
        <ol className="list-decimal list-inside space-y-2 text-slate-400">
          <li>
            <strong className="text-slate-200">Approve:</strong> The subscriber grants an ICRC-2 token allowance to the
            subscription canister, permitting it to transfer tokens on their behalf.
          </li>
          <li>
            <strong className="text-slate-200">Subscribe:</strong> The subscriber calls <code className="text-emerald-400">icrc79_subscribe</code>{' '}
            with the service canister, token, amount, and interval.
          </li>
          <li>
            <strong className="text-slate-200">Payments:</strong> The subscription canister automatically executes
            payments at each interval, transferring tokens from the subscriber's account to the service.
          </li>
          <li>
            <strong className="text-slate-200">Manage:</strong> Subscribers can pause, resume, or cancel subscriptions
            at any time.
          </li>
        </ol>
      </section>

      <section className="mb-8">
        <h3 className="text-xl font-semibold text-slate-200 mb-3">Canister Details</h3>
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="flex justify-between items-center mb-2">
            <span className="text-slate-400">Canister ID</span>
            <code className="text-emerald-400 text-sm">{CONFIG.SUBS_CANISTER_ID}</code>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">IC Dashboard</span>
            <a
              href={`https://dashboard.internetcomputer.org/canister/${CONFIG.SUBS_CANISTER_ID}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:text-emerald-300 text-sm transition-colors"
            >
              View →
            </a>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h3 className="text-xl font-semibold text-slate-200 mb-3">Deep Link Integration</h3>
        <p className="text-slate-400 mb-3">
          Service developers can generate links that pre-fill the subscription form for their users:
        </p>
        <p className="text-slate-500 text-sm mb-3">
          The <span className="font-mono text-slate-300">service</span> parameter should be your backend/service canister principal. It represents the canister that will call or manage ICRC-79 methods for your app, not an end-user principal.
        </p>
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 overflow-x-auto">
          <code className="text-sm text-emerald-400 whitespace-nowrap">
            {`/#/subscribe?token=<principal>&service=<your-service-canister>&amount=<nat>&interval=<Monthly|Interval|Days|...>&intervalValue=<nat>&product=<nat>&endDate=<YYYY-MM-DD>&memo=<text>&targetAccount=<principal[:64hex-subaccount]>&broker=<principal[:64hex-subaccount]>&redirect=<url>`}
          </code>
        </div>
        <div className="mt-4">
          <DeepLinkBuilder
            title="Interactive Deep Link Builder"
            description="Fill in only the values you want to lock down. Leave the rest blank for subscriber input, and choose tokens from the supported-token registry."
          />
        </div>
        <p className="text-slate-500 text-sm mt-4">
          Any query parameter may be omitted from the generated URL. Omitting a required request field just means the subscribe form leaves it for the user to complete before submission. Optional request fields may be omitted entirely and will use the request defaults described below.
        </p>
        <div className="mt-4">
          <h4 className="text-sm font-semibold text-slate-300 mb-2">Builder URL Parameters</h4>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400">
                <th className="py-1 px-2">Param</th>
                <th className="py-1 px-2">Description</th>
                <th className="py-1 px-2">Optional In Request?</th>
                <th className="py-1 px-2">Default / Behavior If Omitted</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              <tr className="border-b border-slate-800">
                <td className="py-1 px-2 font-mono text-emerald-400">token</td>
                <td className="py-1 px-2">Token canister principal selected from the supported-token registry</td>
                <td className="py-1 px-2">No</td>
                <td className="py-1 px-2 text-slate-500 text-xs">No request default. If omitted from the URL, the user must choose a token before submit.</td>
              </tr>
              <tr className="border-b border-slate-800">
                <td className="py-1 px-2 font-mono text-emerald-400">service</td>
                <td className="py-1 px-2">Your service/backend canister principal that will make ICRC-79 calls for the app</td>
                <td className="py-1 px-2">No</td>
                <td className="py-1 px-2 text-slate-500 text-xs">No request default. If omitted from the URL, the user or calling app must supply the service canister before submit.</td>
              </tr>
              <tr className="border-b border-slate-800">
                <td className="py-1 px-2 font-mono text-emerald-400">amount</td>
                <td className="py-1 px-2">Amount per interval (in token's smallest unit)</td>
                <td className="py-1 px-2">No</td>
                <td className="py-1 px-2 text-slate-500 text-xs">No request default. If omitted from the URL, the user must enter an amount before submit.</td>
              </tr>
              <tr className="border-b border-slate-800">
                <td className="py-1 px-2 font-mono text-emerald-400">interval</td>
                <td className="py-1 px-2">Hourly, Daily, Weekly, Monthly, Yearly, Interval, Days, Weeks, Months</td>
                <td className="py-1 px-2">No</td>
                <td className="py-1 px-2 text-slate-500 text-xs">The builder UI defaults to Monthly when the URL omits interval.</td>
              </tr>
              <tr className="border-b border-slate-800">
                <td className="py-1 px-2 font-mono text-emerald-400">intervalValue</td>
                <td className="py-1 px-2">Required only for custom Interval, Days, Weeks, or Months intervals</td>
                <td className="py-1 px-2">Only for custom intervals</td>
                <td className="py-1 px-2 text-slate-500 text-xs">Ignored unless interval is Interval, Days, Weeks, or Months.</td>
              </tr>
              <tr className="border-b border-slate-800">
                <td className="py-1 px-2 font-mono text-emerald-400">product</td>
                <td className="py-1 px-2">Product ID (nat)</td>
                <td className="py-1 px-2">Yes</td>
                <td className="py-1 px-2 text-slate-500 text-xs">No product ID is attached if omitted.</td>
              </tr>
              <tr className="border-b border-slate-800">
                <td className="py-1 px-2 font-mono text-emerald-400">endDate</td>
                <td className="py-1 px-2">Subscription end date (YYYY-MM-DD)</td>
                <td className="py-1 px-2">Yes</td>
                <td className="py-1 px-2 text-slate-500 text-xs">Subscription stays active indefinitely until canceled or paused.</td>
              </tr>
              <tr className="border-b border-slate-800">
                <td className="py-1 px-2 font-mono text-emerald-400">memo</td>
                <td className="py-1 px-2">Memo blob (hex or text)</td>
                <td className="py-1 px-2">Yes</td>
                <td className="py-1 px-2 text-slate-500 text-xs">No memo is attached.</td>
              </tr>
              <tr className="border-b border-slate-800">
                <td className="py-1 px-2 font-mono text-emerald-400">targetAccount</td>
                <td className="py-1 px-2">Target account for payments as a principal or <span className="font-mono">principal:64-hex-subaccount</span></td>
                <td className="py-1 px-2">Yes</td>
                <td className="py-1 px-2 text-slate-500 text-xs">Defaults to the service canister&apos;s default account.</td>
              </tr>
              <tr className="border-b border-slate-800">
                <td className="py-1 px-2 font-mono text-emerald-400">broker</td>
                <td className="py-1 px-2">Broker account as a principal or <span className="font-mono">principal:64-hex-subaccount</span></td>
                <td className="py-1 px-2">Yes</td>
                <td className="py-1 px-2 text-slate-500 text-xs">No broker is attached and no broker fee is requested.</td>
              </tr>
              <tr className="border-b border-slate-800">
                <td className="py-1 px-2 font-mono text-emerald-400">redirect</td>
                <td className="py-1 px-2">URL to redirect after subscription completion</td>
                <td className="py-1 px-2">Builder-only</td>
                <td className="py-1 px-2 text-slate-500 text-xs">No redirect is performed after success.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="mt-4">
          <h4 className="text-sm font-semibold text-slate-300 mb-2">Optional Request Items Not Yet Exposed By The URL Builder</h4>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400">
                <th className="py-1 px-2">Request Item</th>
                <th className="py-1 px-2">Default / Behavior If Omitted</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              <tr className="border-b border-slate-800">
                <td className="py-1 px-2 font-mono text-emerald-400">tokenPointer</td>
                <td className="py-1 px-2 text-slate-500 text-xs">No token pointer is attached. The primary token canister route is used.</td>
              </tr>
              <tr className="border-b border-slate-800">
                <td className="py-1 px-2 font-mono text-emerald-400">baseRateAsset</td>
                <td className="py-1 px-2 text-slate-500 text-xs">No exchange-rate override is applied. The raw token amount is used as entered.</td>
              </tr>
              <tr className="border-b border-slate-800">
                <td className="py-1 px-2 font-mono text-emerald-400">firstPayment</td>
                <td className="py-1 px-2 text-slate-500 text-xs">If omitted, the first payment is immediate.</td>
              </tr>
              <tr className="border-b border-slate-800">
                <td className="py-1 px-2 font-mono text-emerald-400">nowPayment</td>
                <td className="py-1 px-2 text-slate-500 text-xs">No immediate override payment is scheduled.</td>
              </tr>
              <tr className="border-b border-slate-800">
                <td className="py-1 px-2 font-mono text-emerald-400">createdAtTime</td>
                <td className="py-1 px-2 text-slate-500 text-xs">No caller-supplied deduplication timestamp override is attached.</td>
              </tr>
              <tr className="border-b border-slate-800">
                <td className="py-1 px-2 font-mono text-emerald-400">subaccount</td>
                <td className="py-1 px-2 text-slate-500 text-xs">The subscriber&apos;s default account is used with no explicit subaccount override.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-slate-500 text-sm mt-3">
          In practice, the generated URL is only a prefill mechanism. The final subscription request still requires token, service, amount, and interval before submit; the rest are truly optional and fall back to the defaults above when omitted. After a successful subscription, the user can be redirected back with <code className="text-emerald-400">?subscriptionId=...&status=ok</code> appended.
        </p>
      </section>

      <section>
        <h3 className="text-xl font-semibold text-slate-200 mb-3">Standards & Resources</h3>
        <ul className="list-disc list-inside space-y-1 text-slate-400">
          <li>
            <a href="https://github.com/icdevs/ICEventsWG/blob/main/Meetings/20240229/icrc79.md" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300">
              ICRC-79 Specification
            </a>
          </li>
          <li>
            <a href="https://github.com/dfinity/ICRC-1/blob/main/standards/ICRC-2/README.md" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300">
              ICRC-2 (Token Approval Standard)
            </a>
          </li>
          <li>
            <a href="https://github.com/dfinity/ICRC-1/blob/main/standards/ICRC-3/README.md" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300">
              ICRC-3 (Transaction Log)
            </a>
          </li>
        </ul>
      </section>
    </div>
  );
}
