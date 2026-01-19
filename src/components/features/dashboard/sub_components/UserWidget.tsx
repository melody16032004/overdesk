import React, { useEffect, useRef, useState } from "react";
import { useAppStore } from "../../../../stores/useAppStore";

export const UserWidget = () => {
  const { userName, setUserName } = useAppStore();
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(userName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTempName(userName);
  }, [userName]);
  useEffect(() => {
    if (isEditing) {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 50);
    }
  }, [isEditing]);

  const handleSave = () => {
    if (tempName.trim()) setUserName(tempName.trim());
    else setTempName(userName);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") {
      setTempName(userName);
      setIsEditing(false);
    }
  };

  const firstLetter = (userName || "U").charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-2 shrink-0 z-20">
      <div className="text-right leading-tight">
        <div className="text-[9.5px] text-slate-300 font-medium select-none">
          Welcome back,
        </div>
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="w-20 text-right text-sm font-bold bg-transparent border-b-2 border-indigo-500 outline-none text-slate-800 dark:text-white p-0"
          />
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="text-xs font-bold text-indigo-300 dark:text-white hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors truncate max-w-[100px] cursor-pointer"
          >
            {userName}
          </button>
        )}
      </div>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsEditing(true);
        }}
        className="shrink-0 w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 shadow-md shadow-indigo-500/20 flex items-center justify-center text-white font-bold text-lg select-none ring-2 ring-white dark:ring-white/10 hover:scale-105 active:scale-95 transition-transform cursor-pointer relative z-50"
      >
        {firstLetter}
      </button>
      {isEditing && (
        <div
          className="fixed inset-0 z-40 cursor-default"
          onClick={handleSave}
        />
      )}
    </div>
  );
};
