export const BasicMode = ({
  inputRef,
  input,
  result,
  setInput,
  handleBtnClick,
}: any) => (
  <div className="w-full mt-8 z-0 relative flex-1 flex flex-col justify-end">
    <input
      ref={inputRef}
      type="text"
      value={input}
      onChange={(e) => setInput(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") handleBtnClick("=");
      }}
      className="w-full bg-transparent text-right text-xl font-bold text-slate-800 dark:text-white outline-none placeholder:text-slate-300 font-mono tracking-tight"
      placeholder="0"
      autoFocus
      autoComplete="off"
    />
    {result && (
      <div className="text-xl font-bold text-indigo-500 animate-in slide-in-from-bottom-2 text-right w-full break-words mt-1">
        {input.match(/[x=<>]/) ? result : `= ${result}`}
      </div>
    )}
  </div>
);
