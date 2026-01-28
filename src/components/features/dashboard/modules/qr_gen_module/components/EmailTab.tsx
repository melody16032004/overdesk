export const EmailTab = ({ emailData, setEmailData }: any) => (
  <div className="space-y-2 animate-in fade-in slide-in-from-left-2">
    <input
      type="email"
      placeholder="To: email@example.com"
      className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs outline-none focus:border-indigo-500"
      value={emailData.to}
      onChange={(e) => setEmailData({ ...emailData, to: e.target.value })}
    />
    <input
      type="text"
      placeholder="Subject"
      className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs outline-none focus:border-indigo-500"
      value={emailData.subject}
      onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
    />
    <textarea
      placeholder="Message body..."
      className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs outline-none focus:border-indigo-500 h-20 resize-none"
      value={emailData.body}
      onChange={(e) => setEmailData({ ...emailData, body: e.target.value })}
    />
  </div>
);
