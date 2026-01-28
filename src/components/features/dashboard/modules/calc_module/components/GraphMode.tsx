export const GraphMode = ({ input, graphRef }: any) => (
  <div className="absolute inset-0 top-8 w-full h-full bg-white dark:bg-slate-900 z-0">
    {!input ? (
      <div className="flex items-center justify-center h-full text-xs text-slate-400">
        Enter function (e.g. x^2 or e^x)
      </div>
    ) : (
      <div ref={graphRef} className="w-full h-full overflow-hidden" />
    )}
  </div>
);
