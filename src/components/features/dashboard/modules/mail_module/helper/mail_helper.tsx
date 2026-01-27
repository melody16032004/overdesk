export const playSendSound = (file: any) => {
  try {
    const audio = new Audio(file);
    audio.play();
  } catch (error) {
    console.error("Error playing sound:", error);
  }
};
