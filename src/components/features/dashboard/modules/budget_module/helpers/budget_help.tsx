import { EXCHANGE_RATE } from "../constants/budget_const";

export const formatMoney = (num: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(num);

export const formatUSD = (vnd: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(vnd / EXCHANGE_RATE);

export const playSoundEffect = (file: any) => {
  try {
    const audio = new Audio(file);
    audio.play();
  } catch (error) {
    console.error("Error playing sound:", error);
  }
};
