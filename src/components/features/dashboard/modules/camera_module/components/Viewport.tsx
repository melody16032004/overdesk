import { FILTERS } from "../constants/camera_const";

export const Viewport = ({
  capturedImage,
  recordedVideoUrl,
  videoRef,
  mode,
  zoom,
  activeFilter,
  canvasRef,
}: any) => {
  return (
    <div
      className={`w-full relative flex items-center justify-center bg-black ${
        capturedImage || recordedVideoUrl
          ? "h-[calc(100%-90px)] mt-4"
          : "h-full"
      }`}
    >
      {capturedImage ? (
        <img
          src={capturedImage}
          alt="Result"
          className="w-full h-full object-contain"
        />
      ) : recordedVideoUrl ? (
        <video
          src={recordedVideoUrl}
          controls
          className="w-full h-full object-contain"
          controlsList="nodownload nofullscreen noremoteplayback"
        />
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            onLoadedMetadata={() => videoRef.current?.play()}
            className="w-full h-full object-cover scale-x-[-1]"
            style={{
              filter: mode === "photo" ? FILTERS[activeFilter].css : "none",
              transform: `scaleX(-1) scale(${zoom})`,
            }}
          />
          <div className="absolute inset-0 pointer-events-none opacity-20">
            <div className="w-full h-1/3 border-b border-white"></div>
            <div className="w-full h-1/3 border-b border-white top-1/3 absolute"></div>
            <div className="h-full w-1/3 border-r border-white absolute top-0 left-0"></div>
            <div className="h-full w-1/3 border-r border-white absolute top-0 right-1/3"></div>
          </div>
        </>
      )}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};
