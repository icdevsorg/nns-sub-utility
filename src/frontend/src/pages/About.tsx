import { CONFIG } from '../config';

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
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 overflow-x-auto">
          <code className="text-sm text-emerald-400 whitespace-nowrap">
            {`/#/subscribe?token=<principal>&service=<principal>&amount=<nat>&interval=<Monthly|Weekly|...>&product=<nat>&endDate=<ns>&memo=<text>&targetAccount=<principal>&broker=<principal>&redirect=<url>`}
          </code>
        </div>
        <div className="mt-4">
          <h4 className="text-sm font-semibold text-slate-300 mb-2">Parameters</h4>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400">
                <th className="py-1 px-2">Param</th>
                <th className="py-1 px-2">Description</th>
                <th className="py-1 px-2">Default</th>
                <th className="py-1 px-2">Required</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              <tr className="border-b border-slate-800">
                <td className="py-1 px-2 font-mono text-emerald-400">token</td>
                <td className="py-1 px-2">Token canister principal</td>
                <td className="py-1 px-2 text-slate-500 text-xs">User selects</td>
                <td className="py-1 px-2">No</td>
              </tr>
              <tr className="border-b border-slate-800">
                <td className="py-1 px-2 font-mono text-emerald-400">service</td>
                <td className="py-1 px-2">Service canister principal</td>
                <td className="py-1 px-2 text-slate-500 text-xs">User enters</td>
                <td className="py-1 px-2">No</td>
              </tr>
              <tr className="border-b border-slate-800">
                <td className="py-1 px-2 font-mono text-emerald-400">amount</td>
                <td className="py-1 px-2">Amount per interval (in token's smallest unit)</td>
                <td className="py-1 px-2 text-slate-500 text-xs">User enters</td>
                <td className="py-1 px-2">No</td>
              </tr>
              <tr className="border-b border-slate-800">
                <td className="py-1 px-2 font-mono text-emerald-400">interval</td>
                <td className="py-1 px-2">Hourly, Daily, Weekly, Monthly, Yearly</td>
                <td className="py-1 px-2 text-slate-500 text-xs">Monthly</td>
                <td className="py-1 px-2">No</td>
              </tr>
              <tr className="border-b border-slate-800">
                <td className="py-1 px-2 font-mono text-emerald-400">product</td>
                <td className="py-1 px-2">Product ID (nat)</td>
                <td className="py-1 px-2 text-slate-500 text-xs">0</td>
                <td className="py-1 px-2">No</td>
              </tr>
              <tr className="border-b border-slate-800">
                <td className="py-1 px-2 font-mono text-emerald-400">endDate</td>
                <td className="py-1 px-2">Subscription end date (nanosecond timestamp)</td>
                <td className="py-1 px-2 text-slate-500 text-xs">None (indefinite)</td>
                <td className="py-1 px-2">No</td>
              </tr>
              <tr className="border-b border-slate-800">
                <td className="py-1 px-2 font-mono text-emerald-400">memo</td>
                <td className="py-1 px-2">Memo blob (hex or text)</td>
                <td className="py-1 px-2 text-slate-500 text-xs">None</td>
                <td className="py-1 px-2">No</td>
              </tr>
              <tr className="border-b border-slate-800">
                <td className="py-1 px-2 font-mono text-emerald-400">targetAccount</td>
                <td className="py-1 px-2">Target account for payments (principal)</td>
                <td className="py-1 px-2 text-slate-500 text-xs">Service default</td>
                <td className="py-1 px-2">No</td>
              </tr>
              <tr className="border-b border-slate-800">
                <td className="py-1 px-2 font-mono text-emerald-400">broker</td>
                <td className="py-1 px-2">Broker principal for fee splitting</td>
                <td className="py-1 px-2 text-slate-500 text-xs">None</td>
                <td className="py-1 px-2">No</td>
              </tr>
              <tr className="border-b border-slate-800">
                <td className="py-1 px-2 font-mono text-emerald-400">redirect</td>
                <td className="py-1 px-2">URL to redirect after subscription completion</td>
                <td className="py-1 px-2 text-slate-500 text-xs">None</td>
                <td className="py-1 px-2">No</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-slate-500 text-sm mt-3">
          All parameters are optional — missing ones are left blank for user input. After a successful subscription,
          the user can be redirected back with <code className="text-emerald-400">?subscriptionId=...&status=ok</code> appended.
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
