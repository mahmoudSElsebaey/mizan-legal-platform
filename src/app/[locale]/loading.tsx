export default function LocaleLoading() {
  return <main aria-busy="true" className="container min-h-[60vh] py-16">
    <p className="text-sm font-bold text-[#176b67]">ميزان للمحاماة · Mizan Legal</p>
    <div className="mt-8 h-10 max-w-xl animate-pulse rounded-xl bg-[#14263d]/10" />
    <div className="mt-4 h-5 max-w-2xl animate-pulse rounded-lg bg-[#14263d]/10" />
    <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[1,2,3].map((item) => <div key={item} className="h-44 animate-pulse rounded-3xl border border-[#14263d]/10 bg-white/60" />)}</div>
    <p className="mt-6 text-sm text-[#657184]">جارٍ تحميل الصفحة... Loading page...</p>
  </main>;
}
