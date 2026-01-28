import { Delete, Equal } from "lucide-react";
import { Button } from "./Button";

export const Keypad = ({ isScientific, input }: any) => (
  <div
    className={`grid gap-1.5 transition-all ${isScientific ? "grid-cols-6" : "grid-cols-4"}`}
  >
    {isScientific && (
      <>
        <Button
          label="∫"
          val="int"
          type="sci"
          className="text-violet-500 font-serif italic"
        />
        <Button
          label="d/dx"
          val="diff"
          type="sci"
          className="text-violet-500"
        />
        <Button label="lim" val="lim" type="sci" className="text-violet-500" />
        <Button label="AC" type="sci" className="text-red-500 font-bold" />
        <Button
          label={<Delete size={18} />}
          val="DEL"
          type="sci"
          className="text-red-500"
        />
        <Button label="÷" type="op" />
        <Button label="nCr" type="sci" className="text-orange-500" />
        <Button label="nPr" type="sci" className="text-orange-500" />
        <Button label="7" /> <Button label="8" /> <Button label="9" />{" "}
        <Button label="×" type="op" />
        <Button label="sin" type="sci" />
        <Button label="cos" type="sci" />
        <Button label="4" /> <Button label="5" /> <Button label="6" />{" "}
        <Button label="-" type="op" />
        <Button label="tan" type="sci" />
        <Button label="x!" val="!" type="sci" />
        <Button label="1" /> <Button label="2" /> <Button label="3" />{" "}
        <Button label="+" type="op" />
        <Button label="ln" val="ln" type="sci" />
        <Button label="log" type="sci" />
        <Button label="0" /> <Button label="." />{" "}
        <Button label="e" type="sci" />
        <Button label="=" type="eval" className="bg-indigo-500 text-white" />
        <Button label="xʸ" val="^" type="sci" />
        <Button label="√" type="sci" />
        <Button label="π" val="pi" type="sci" />
        <Button label="abs" type="sci" />
        <Button label="eˣ" val="e^x" type="sci" />
        <Button
          label="SOLVE"
          val="="
          type="eval"
          className="bg-emerald-500 text-white text-[10px]"
        />
        <Button label="x²" val="x^2" type="sci" />
        <Button label="ʸ√x" val="y^(1/" type="sci" />
        <Button label="sin²" val="sin(x)^2" type="sci" />
        <Button label="cos²" val="cos(x)^2" type="sci" />
        <Button label="tan²" val="tan(x)^2" type="sci" />
        <Button label="( )" val="()" type="sci" />
      </>
    )}

    {!isScientific && (
      <>
        <Button label="AC" type="sci" className="text-red-500 font-bold" />
        <Button
          label={<Delete size={18} />}
          val="DEL"
          type="sci"
          className="text-red-500"
        />
        <Button label="x" type="var" />
        <Button label="÷" type="op" />
        <Button label="7" /> <Button label="8" /> <Button label="9" />{" "}
        <Button label="×" type="op" />
        <Button label="4" /> <Button label="5" /> <Button label="6" />{" "}
        <Button label="-" type="op" />
        <Button label="1" /> <Button label="2" /> <Button label="3" />{" "}
        <Button label="+" type="op" />
        <Button label="0" className="col-span-2" />
        <Button label="." />
        <Button
          label={input.match(/[=<>]/) ? "SOLVE" : <Equal size={24} />}
          val="="
          type="eval"
          className={input.match(/[=<>]/) ? "text-[10px] bg-emerald-500" : ""}
        />
      </>
    )}
  </div>
);
